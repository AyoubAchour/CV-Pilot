import { app } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";

import { createBlankCv, normalizeCvDocument, type CvDocument } from "../shared/cv-model";
import { getCvTitle } from "../shared/cv-template";

export interface ProjectSummary {
  id: string;
  title: string;
  customTitle?: string;
  lastEdited: string;
  tags: string[];
  completion?: number; // 0..1
}

export interface SaveProjectCvInput {
  projectId: string;
  cv: CvDocument;
}

export type CreateBlankCvProjectResult = {
  project: ProjectSummary;
  cv: CvDocument;
};

function assertProjectId(projectId: string): void {
  // Project IDs are generated via randomUUID().
  // Reject anything else to avoid path traversal.
  if (!/^[0-9a-fA-F-]{36}$/.test(projectId)) {
    throw new Error("Invalid projectId");
  }
}

function getProjectsRootDir(): string {
  return path.join(app.getPath("userData"), "projects");
}

function getProjectDir(projectId: string): string {
  assertProjectId(projectId);
  return path.join(getProjectsRootDir(), projectId);
}

async function writeProjectRecord(projectDir: string, record: unknown): Promise<void> {
  await fs.writeFile(
    path.join(projectDir, "project.json"),
    JSON.stringify(record, null, 2),
    "utf8"
  );
}

async function readJsonFile(filePath: string): Promise<unknown> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function readProjectSummary(projectDir: string): Promise<ProjectSummary | null> {
  try {
    const raw = await fs.readFile(path.join(projectDir, "project.json"), "utf8");
    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    const id = typeof record.id === "string" ? record.id : null;
    const title = typeof record.title === "string" ? record.title : null;
    const customTitle = typeof record.customTitle === "string" ? record.customTitle : undefined;
    const updatedAt = typeof record.updatedAt === "string" ? record.updatedAt : null;
    const completion = typeof record.completion === "number" && Number.isFinite(record.completion)
      ? Math.max(0, Math.min(1, record.completion))
      : undefined;
    const tags = Array.isArray(record.tags)
      ? record.tags.filter((t): t is string => typeof t === "string")
      : [];

    if (!id || !title || !updatedAt) {
      return null;
    }

    return {
      id,
      title: customTitle || title,
      customTitle,
      lastEdited: updatedAt,
      tags,
      completion,
    };
  } catch {
    return null;
  }
}

function computeCvCompletion(cv: CvDocument): number {
  const score = (ok: boolean) => (ok ? 1 : 0);
  const nonEmpty = (value: string | null | undefined) =>
    typeof value === "string" && value.trim().length > 0;

  const hasAny = (values: Array<string | null | undefined>) =>
    (values ?? []).some((v) => nonEmpty(v));

  const links = Array.isArray(cv.basics.links) ? cv.basics.links : [];

  const hasSkills = (cv.skills ?? []).some((s) => (s ?? "").trim().length > 0);

  const hasExperience = (cv.experience ?? []).some((e) =>
    nonEmpty(e.role) || nonEmpty(e.company) || hasAny(e.highlights ?? [])
  );

  const hasEducation = (cv.education ?? []).some((ed) =>
    nonEmpty(ed.school) || nonEmpty(ed.degree) || hasAny(ed.highlights ?? [])
  );

  const hasProjects = (cv.projects ?? []).some((p) =>
    nonEmpty(p.title) || nonEmpty(p.link) || hasAny(p.highlights ?? [])
  );

  // Keep this simple and predictable: 10 equally weighted checks.
  const checks = [
    score(nonEmpty(cv.basics.fullName)),
    score(nonEmpty(cv.basics.headline)),
    score(nonEmpty(cv.basics.email)),
    score(nonEmpty(cv.basics.phone)),
    score(nonEmpty(cv.basics.location)),
    score(nonEmpty(cv.basics.summary)),
    score(hasAny(links)),
    score(hasSkills),
    score(hasExperience),
    score(hasEducation || hasProjects),
  ];

  const total = checks.length;
  const done = checks.reduce((sum, v) => sum + v, 0);
  const ratio = total > 0 ? done / total : 0;

  // Clamp + round to 3dp for stable UI.
  return Math.max(0, Math.min(1, Math.round(ratio * 1000) / 1000));
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const projectsRootDir = getProjectsRootDir();
  await fs.mkdir(projectsRootDir, { recursive: true });

  const entries = await fs.readdir(projectsRootDir, { withFileTypes: true });
  const summaries: ProjectSummary[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const projectDir = path.join(projectsRootDir, entry.name);
    const summary = await readProjectSummary(projectDir);
    if (summary) {
      summaries.push(summary);
    }
  }

  summaries.sort((a, b) => b.lastEdited.localeCompare(a.lastEdited));
  return summaries;
}

export async function createBlankCvProject(): Promise<CreateBlankCvProjectResult> {
  const projectId = randomUUID();
  const projectDir = getProjectDir(projectId);
  await fs.mkdir(projectDir, { recursive: true });

  const cv = createBlankCv();
  const now = new Date().toISOString();
  const completion = computeCvCompletion(cv);

  const projectRecord = {
    id: projectId,
    title: getCvTitle(cv),
    completion,
    createdAt: now,
    updatedAt: now,
    tags: ["cv"],
  };

  await writeProjectRecord(projectDir, projectRecord);
  await fs.writeFile(
    path.join(projectDir, "cv.json"),
    JSON.stringify(cv, null, 2),
    "utf8"
  );

  return {
    project: {
      id: projectId,
      title: projectRecord.title,
      lastEdited: now,
      tags: ["cv"],
      completion,
    },
    cv,
  };
}

export async function getProjectCv(projectId: string): Promise<CvDocument> {
  if (typeof projectId !== "string") {
    throw new Error("Invalid payload: projectId must be a string");
  }
  const projectDir = getProjectDir(projectId);
  const raw = await readJsonFile(path.join(projectDir, "cv.json"));
  return normalizeCvDocument(raw);
}

export async function saveProjectCv(input: SaveProjectCvInput): Promise<void> {
  if (!input || typeof input.projectId !== "string" || !input.cv) {
    throw new Error("Invalid payload");
  }

  const normalizedCv = normalizeCvDocument(input.cv);

  const projectDir = getProjectDir(input.projectId);
  await fs.writeFile(
    path.join(projectDir, "cv.json"),
    JSON.stringify(normalizedCv, null, 2),
    "utf8"
  );

  const now = new Date().toISOString();
  let existingCreatedAt: string | null = null;
  let existingCustomTitle: string | null = null;

  try {
    const existing = await readJsonFile(path.join(projectDir, "project.json"));
    if (existing && typeof existing === "object") {
      const record = existing as Record<string, unknown>;
      existingCreatedAt = typeof record.createdAt === "string" ? record.createdAt : null;
      existingCustomTitle = typeof record.customTitle === "string" && record.customTitle.trim().length > 0
        ? record.customTitle
        : null;
    }
  } catch {
    // ignore
  }

  const projectRecord: {
    id: string;
    title: string;
    customTitle?: string;
    completion: number;
    updatedAt: string;
    tags: string[];
    createdAt?: string;
  } = {
    id: input.projectId,
    title: getCvTitle(normalizedCv),
    completion: computeCvCompletion(normalizedCv),
    updatedAt: now,
    tags: ["cv"],
  };

  // Preserve createdAt if it exists.
  if (existingCreatedAt) {
    projectRecord.createdAt = existingCreatedAt;
  }

  // Preserve customTitle if it exists.
  if (existingCustomTitle) {
    projectRecord.customTitle = existingCustomTitle;
  }

  await writeProjectRecord(projectDir, projectRecord);
}

export async function deleteProject(projectId: string): Promise<void> {
  if (typeof projectId !== "string") {
    throw new Error("Invalid payload: projectId must be a string");
  }
  const projectDir = getProjectDir(projectId);
  // `force: true` makes delete idempotent if the project is already gone.
  await fs.rm(projectDir, { recursive: true, force: true });
}

export interface RenameProjectInput {
  projectId: string;
  customTitle: string;
}

export async function renameProject(input: RenameProjectInput): Promise<{ title: string }> {
  if (!input || typeof input.projectId !== "string") {
    throw new Error("Invalid payload: projectId must be a string");
  }

  const projectDir = getProjectDir(input.projectId);
  const projectFile = path.join(projectDir, "project.json");

  let existing: Record<string, unknown> = {};
  try {
    const raw = await fs.readFile(projectFile, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      existing = parsed as Record<string, unknown>;
    }
  } catch {
    throw new Error("Project not found");
  }

  const trimmedTitle = (input.customTitle ?? "").trim();
  const now = new Date().toISOString();

  // If custom title is empty, remove customTitle field (fall back to auto-derived)
  if (trimmedTitle.length === 0) {
    delete existing.customTitle;
  } else {
    existing.customTitle = trimmedTitle;
  }
  existing.updatedAt = now;

  await writeProjectRecord(projectDir, existing);

  // Return the effective title
  const effectiveTitle = trimmedTitle.length > 0
    ? trimmedTitle
    : (typeof existing.title === "string" ? existing.title : "Untitled CV");

  return { title: effectiveTitle };
}
