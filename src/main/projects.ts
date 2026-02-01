import { app } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";

import { createBlankCv, normalizeCvDocument, type CvDocument } from "../shared/cv-model";
import { getCvTitle } from "../shared/cv-template";

export interface ProjectSummary {
  id: string;
  title: string;
  lastEdited: string;
  tags: string[];
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
    const updatedAt = typeof record.updatedAt === "string" ? record.updatedAt : null;
    const tags = Array.isArray(record.tags)
      ? record.tags.filter((t): t is string => typeof t === "string")
      : [];

    if (!id || !title || !updatedAt) {
      return null;
    }

    return {
      id,
      title,
      lastEdited: updatedAt,
      tags,
    };
  } catch {
    return null;
  }
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

  const projectRecord = {
    id: projectId,
    title: getCvTitle(cv),
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

  const projectDir = getProjectDir(input.projectId);
  await fs.writeFile(
    path.join(projectDir, "cv.json"),
    JSON.stringify(input.cv, null, 2),
    "utf8"
  );

  const now = new Date().toISOString();
  let existingCreatedAt: string | null = null;

  try {
    const existing = await readJsonFile(path.join(projectDir, "project.json"));
    if (existing && typeof existing === "object") {
      const record = existing as Record<string, unknown>;
      existingCreatedAt = typeof record.createdAt === "string" ? record.createdAt : null;
    }
  } catch {
    // ignore
  }

  const projectRecord: {
    id: string;
    title: string;
    updatedAt: string;
    tags: string[];
    createdAt?: string;
  } = {
    id: input.projectId,
    title: getCvTitle(input.cv),
    updatedAt: now,
    tags: ["cv"],
  };

  // Preserve createdAt if it exists.
  if (existingCreatedAt) {
    projectRecord.createdAt = existingCreatedAt;
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
