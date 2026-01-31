import type { CvDocument } from "./cv-model";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nonEmptyLines(lines: string[]): string[] {
  return lines.map((v) => v.trim()).filter((v) => v.length > 0);
}

type SkillGroup = { label: string; items: string[] };

function normalizeSkillDisplay(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  const key = trimmed.toLowerCase();

  const map: Record<string, string> = {
    js: "JavaScript",
    javascript: "JavaScript",
    ts: "TypeScript",
    typescript: "TypeScript",
    node: "Node.js",
    nodejs: "Node.js",
    "node.js": "Node.js",
    reactjs: "React",
    react: "React",
    next: "Next.js",
    nextjs: "Next.js",
    "next.js": "Next.js",
    github: "GitHub",
    "github actions": "GitHub Actions",
    eslint: "ESLint",
    tailwindcss: "Tailwind CSS",
    postcss: "PostCSS",
  };

  return map[key] ?? trimmed;
}

function normalizeSkillKey(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function groupSkills(skills: string[]): SkillGroup[] {
  const groups = new Map<string, string[]>();
  const seen = new Set<string>();

  const ensure = (label: string) => {
    const existing = groups.get(label);
    if (existing) return existing;
    const next: string[] = [];
    groups.set(label, next);
    return next;
  };

  const categorize = (key: string): string => {
    const languageKeys = new Set([
      "typescript",
      "javascript",
      "rust",
      "python",
      "go",
      "java",
      "c",
      "c++",
      "c#",
      "sql",
      "bash",
      "powershell",
    ]);
    const frameworkKeys = new Set([
      "react",
      "next.js",
      "electron",
      "node.js",
      "express",
      "vite",
      "tailwind css",
      "tailwind",
    ]);
    const toolingKeys = new Set([
      "git",
      "github",
      "github actions",
      "eslint",
      "prettier",
      "docker",
      "electron forge",
      "postcss",
      "npm",
      "pnpm",
      "yarn",
    ]);
    const testingKeys = new Set(["jest", "vitest", "playwright", "cypress"]);
    const databaseKeys = new Set([
      "postgresql",
      "postgres",
      "mysql",
      "sqlite",
      "mongodb",
      "redis",
    ]);
    const cloudKeys = new Set(["aws", "azure", "gcp", "vercel", "ci/cd", "cicd"]);

    if (languageKeys.has(key)) return "Languages";
    if (frameworkKeys.has(key)) return "Frameworks";
    if (toolingKeys.has(key)) return "Tooling";
    if (testingKeys.has(key)) return "Testing";
    if (databaseKeys.has(key)) return "Databases";
    if (cloudKeys.has(key)) return "DevOps/Cloud";
    return "Other";
  };

  for (const raw of skills) {
    const display = normalizeSkillDisplay(raw);
    const key = normalizeSkillKey(display);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);

    const label = categorize(key);
    ensure(label).push(display);
  }

  const order = [
    "Languages",
    "Frameworks",
    "Tooling",
    "Testing",
    "Databases",
    "DevOps/Cloud",
    "Other",
  ];
  const out: SkillGroup[] = [];
  for (const label of order) {
    const items = groups.get(label);
    if (items && items.length > 0) {
      out.push({ label, items });
    }
  }
  return out;
}

export function getCvTitle(cv: CvDocument): string {
  const name = cv.basics.fullName.trim();
  return name.length > 0 ? `${name} — CV` : "Untitled CV";
}

export function getCvSuggestedFileName(cv: CvDocument): string {
  const base = cv.basics.fullName.trim().replace(/[\\/:*?"<>|]+/g, "").trim();
  return base.length > 0 ? `${base} - CV.pdf` : "cv.pdf";
}

export function renderCvHtmlDocument(cv: CvDocument): string {
  const title = getCvTitle(cv);

  const links = nonEmptyLines(cv.basics.links ?? []);

  const experience = (cv.experience ?? []).filter(
    (e) =>
      [e.company, e.role, e.location, e.start, e.end]
        .map((v) => v?.trim?.() ?? "")
        .join("")
        .length > 0 ||
      nonEmptyLines(e.highlights ?? []).length > 0
  );

  const education = (cv.education ?? []).filter(
    (e) =>
      [e.school, e.degree, e.location, e.start, e.end]
        .map((v) => v?.trim?.() ?? "")
        .join("")
        .length > 0 ||
      nonEmptyLines(e.highlights ?? []).length > 0
  );

  const projects = (cv.projects ?? []).filter(
    (p) =>
      [p.title, p.date, p.link].map((v) => v?.trim?.() ?? "").join("").length > 0 ||
      nonEmptyLines(p.highlights ?? []).length > 0
  );

  const certifications = (cv.certifications ?? []).filter(
    (c) =>
      [c.name, c.issuer, c.date, c.link]
        .map((v) => v?.trim?.() ?? "")
        .join("")
        .length > 0 ||
      nonEmptyLines(c.highlights ?? []).length > 0
  );

  const awards = (cv.awards ?? []).filter(
    (a) =>
      [a.title, a.issuer, a.date].map((v) => v?.trim?.() ?? "").join("").length > 0 ||
      nonEmptyLines(a.highlights ?? []).length > 0
  );

  const publications = (cv.publications ?? []).filter(
    (p) =>
      [p.title, p.venue, p.date, p.link]
        .map((v) => v?.trim?.() ?? "")
        .join("")
        .length > 0 ||
      nonEmptyLines(p.highlights ?? []).length > 0
  );

  const volunteering = (cv.volunteering ?? []).filter(
    (v) =>
      [v.organization, v.role, v.location, v.start, v.end]
        .map((vv) => vv?.trim?.() ?? "")
        .join("")
        .length > 0 ||
      nonEmptyLines(v.highlights ?? []).length > 0
  );

  const skills = nonEmptyLines(cv.skills ?? []);

  const css = `
:root{
  --ink:#111827;
  --muted:#374151;
  --rule:#e5e7eb;
  --bg:#f3f4f6;
}
*{box-sizing:border-box;}
html,body{height:100%;}
body{
  margin:0;
  font-family: Calibri, Arial, Helvetica, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  color:var(--ink);
  background:var(--bg);
}

/* Page size is A4. Margins are applied via printToPDF options for toggleable consistency. */
@page{ size: A4; margin: 0; }

.page{
  width:210mm;
  min-height:297mm;
  margin:0;
  background:#fff;
  box-shadow: 0 10px 30px rgba(17,24,39,.10);
  border: 1px solid rgba(17,24,39,.08);
  padding: 12mm 14mm;
}

.name{font-size:22px; font-weight:700; line-height:1.1;}
.headline{margin-top:4px; color:var(--muted); font-size:12.5px; line-height:1.35;}
.contact{margin-top:8px; color:var(--muted); font-size:11.5px; line-height:1.35;}
.contact a{color:inherit; text-decoration:none; border-bottom:1px solid rgba(55,65,81,.35);}

.rule{height:1px; background:var(--rule); margin:10px 0 12px;}
.section{margin-top:10px;}
.section-title{
  font-size:12px;
  font-weight:700;
  color:var(--ink);
  margin:0 0 6px;
}
.p{font-size:12px; line-height:1.5; margin:0;}

.item{margin:0 0 10px;}
.item-head{display:flex; justify-content:space-between; gap:12px; align-items:baseline;}
.item-title{font-size:12.5px; font-weight:700;}
.item-meta{font-size:11.5px; color:var(--muted); white-space:nowrap;}
.item-sub{margin-top:3px; font-size:11.5px; color:var(--muted);}
.ul{margin:6px 0 0 16px; padding:0;}
.ul li{margin:2px 0; font-size:11.8px; line-height:1.45;}

.skills{margin-top:2px;}
.skills-row{font-size:11.8px; line-height:1.4; margin:0 0 2px;}
.skills-label{font-weight:700;}

@media print {
  body{ background:#fff; }
  /* Remove the on-screen page box. The real margins come from @page. */
  .page{ width:auto; min-height:auto; margin:0; box-shadow:none; border:none; padding:0; }
}
`;

  const contactParts = nonEmptyLines([
    cv.basics.email,
    cv.basics.phone,
    cv.basics.location,
  ]);

  const contactLinks = links
    .map((href) => {
      const label = href.replace(/^https?:\/\//, "");
      return `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
    })
    .join(" | ");

  const contactLine =
    contactParts.map(escapeHtml).join(" | ") +
    (contactLinks ? (contactParts.length ? " | " : "") + contactLinks : "");

  const summaryHtml = cv.basics.summary.trim()
    ? `<p class="p">${escapeHtml(cv.basics.summary.trim())}</p>`
    : `<p class="p" style="color:var(--muted)">2–4 lines summarizing your role, strengths, and measurable impact.</p>`;

  const experienceHtml = experience.length
    ? experience
        .map((e) => {
          const highlights = nonEmptyLines(e.highlights ?? []);
          const metaParts = nonEmptyLines([
            [e.start?.trim(), e.end?.trim()].filter(Boolean).join(" - "),
            e.location,
          ]);

          const titleParts = nonEmptyLines([e.role, e.company]);

          return `
            <div class="item">
              <div class="item-head">
                <div class="item-title">${escapeHtml(titleParts.join(" | "))}</div>
                <div class="item-meta">${escapeHtml(metaParts.join(" | "))}</div>
              </div>
              ${
                e.company.trim() && !e.role.trim()
                  ? `<div class="item-sub">${escapeHtml(e.company)}</div>`
                  : ``
              }
              ${
                highlights.length
                  ? `<ul class="ul">${highlights
                      .map((h) => `<li>${escapeHtml(h)}</li>`)
                      .join("")}</ul>`
                  : ``
              }
            </div>
          `;
        })
        .join("")
    : `<p class="p" style="color:var(--muted)">Add your work history and quantify results where possible.</p>`;

  const projectsHtml = projects.length
    ? projects
        .map((p) => {
          const highlights = nonEmptyLines(p.highlights ?? []);
          const title = p.title.trim() || "Project";
          const date = p.date?.trim?.() ?? "";
          const link = p.link?.trim?.() ?? "";
          const linkLabel = link.replace(/^https?:\/\//, "");

          return `
            <div class="item">
              <div class="item-head">
                <div class="item-title">${escapeHtml(title)}</div>
                <div class="item-meta">${escapeHtml(date)}</div>
              </div>
              ${
                link
                  ? `<div class="item-sub"><a href="${escapeHtml(link)}">${escapeHtml(
                      linkLabel
                    )}</a></div>`
                  : ``
              }
              ${
                highlights.length
                  ? `<ul class="ul">${highlights
                      .map((h) => `<li>${escapeHtml(h)}</li>`)
                      .join("")}</ul>`
                  : ``
              }
            </div>
          `;
        })
        .join("")
    : `<p class="p" style="color:var(--muted)">Add 1–3 projects that are most relevant to your target role.</p>`;

  const educationHtml = education.length
    ? education
        .map((e) => {
          const highlights = nonEmptyLines(e.highlights ?? []);
          const metaParts = nonEmptyLines([
            [e.start?.trim(), e.end?.trim()].filter(Boolean).join(" - "),
            e.location,
          ]);

          const titleParts = nonEmptyLines([e.degree, e.school]);

          return `
            <div class="item">
              <div class="item-head">
                <div class="item-title">${escapeHtml(titleParts.join(" | "))}</div>
                <div class="item-meta">${escapeHtml(metaParts.join(" | "))}</div>
              </div>
              ${
                highlights.length
                  ? `<ul class="ul">${highlights
                      .map((h) => `<li>${escapeHtml(h)}</li>`)
                      .join("")}</ul>`
                  : ``
              }
            </div>
          `;
        })
        .join("")
    : `<p class="p" style="color:var(--muted)">Add your education, certifications, or relevant coursework.</p>`;

  const certificationsHtml = certifications.length
    ? certifications
        .map((c) => {
          const highlights = nonEmptyLines(c.highlights ?? []);
          const metaParts = nonEmptyLines([c.date]);
          const titleParts = nonEmptyLines([c.name, c.issuer]);
          const link = c.link?.trim?.() ?? "";
          const linkLabel = link.replace(/^https?:\/\//, "");

          return `
            <div class="item">
              <div class="item-head">
                <div class="item-title">${escapeHtml(titleParts.join(" | ") || "Certification")}</div>
                <div class="item-meta">${escapeHtml(metaParts.join(" | "))}</div>
              </div>
              ${
                link
                  ? `<div class="item-sub"><a href="${escapeHtml(link)}">${escapeHtml(
                      linkLabel
                    )}</a></div>`
                  : ``
              }
              ${
                highlights.length
                  ? `<ul class="ul">${highlights
                      .map((h) => `<li>${escapeHtml(h)}</li>`)
                      .join("")}</ul>`
                  : ``
              }
            </div>
          `;
        })
        .join("")
    : `<p class="p" style="color:var(--muted)">Add certifications that matter for your target role.</p>`;

  const skillGroups = groupSkills(skills);
  const skillsHtml = skills.length
    ? `<div class="skills">${skillGroups
        .map(
          (g) =>
            `<div class="skills-row"><span class="skills-label">${escapeHtml(
              g.label
            )}:</span> ${g.items.map(escapeHtml).join(", ")}</div>`
        )
        .join("")}</div>`
    : `<p class="p" style="color:var(--muted)">List skills that match the roles you want (tools, languages, methods).</p>`;

  const awardsHtml = awards.length
    ? awards
        .map((a) => {
          const highlights = nonEmptyLines(a.highlights ?? []);
          const metaParts = nonEmptyLines([a.date]);
          const titleParts = nonEmptyLines([a.title, a.issuer]);

          return `
            <div class="item">
              <div class="item-head">
                <div class="item-title">${escapeHtml(titleParts.join(" | ") || "Award")}</div>
                <div class="item-meta">${escapeHtml(metaParts.join(" | "))}</div>
              </div>
              ${
                highlights.length
                  ? `<ul class="ul">${highlights
                      .map((h) => `<li>${escapeHtml(h)}</li>`)
                      .join("")}</ul>`
                  : ``
              }
            </div>
          `;
        })
        .join("")
    : `<p class="p" style="color:var(--muted)">List awards that help prove excellence or credibility.</p>`;

  const publicationsHtml = publications.length
    ? publications
        .map((p) => {
          const highlights = nonEmptyLines(p.highlights ?? []);
          const metaParts = nonEmptyLines([p.date]);
          const titleParts = nonEmptyLines([p.title, p.venue]);
          const link = p.link?.trim?.() ?? "";
          const linkLabel = link.replace(/^https?:\/\//, "");

          return `
            <div class="item">
              <div class="item-head">
                <div class="item-title">${escapeHtml(titleParts.join(" | ") || "Publication")}</div>
                <div class="item-meta">${escapeHtml(metaParts.join(" | "))}</div>
              </div>
              ${
                link
                  ? `<div class="item-sub"><a href="${escapeHtml(link)}">${escapeHtml(
                      linkLabel
                    )}</a></div>`
                  : ``
              }
              ${
                highlights.length
                  ? `<ul class="ul">${highlights
                      .map((h) => `<li>${escapeHtml(h)}</li>`)
                      .join("")}</ul>`
                  : ``
              }
            </div>
          `;
        })
        .join("")
    : `<p class="p" style="color:var(--muted)">Add publications only if they’re relevant to your target role.</p>`;

  const volunteeringHtml = volunteering.length
    ? volunteering
        .map((v) => {
          const highlights = nonEmptyLines(v.highlights ?? []);
          const metaParts = nonEmptyLines([
            [v.start?.trim(), v.end?.trim()].filter(Boolean).join(" - "),
            v.location,
          ]);
          const titleParts = nonEmptyLines([v.role, v.organization]);

          return `
            <div class="item">
              <div class="item-head">
                <div class="item-title">${escapeHtml(titleParts.join(" | ") || "Volunteering")}</div>
                <div class="item-meta">${escapeHtml(metaParts.join(" | "))}</div>
              </div>
              ${
                highlights.length
                  ? `<ul class="ul">${highlights
                      .map((h) => `<li>${escapeHtml(h)}</li>`)
                      .join("")}</ul>`
                  : ``
              }
            </div>
          `;
        })
        .join("")
    : `<p class="p" style="color:var(--muted)">Add volunteer work that demonstrates leadership or impact.</p>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>${css}</style>
</head>
<body>
  <div class="page">
    <header>
      <div class="name">${escapeHtml(cv.basics.fullName.trim() || "Your Name")}</div>
      <div class="headline">${escapeHtml(cv.basics.headline.trim() || "Target role | specialty | value")}</div>
      <div class="contact">${contactLine || "Email | Phone | Location | Links"}</div>
    </header>

    <div class="rule"></div>

    <section class="section">
      <h2 class="section-title">Professional Summary</h2>
      ${summaryHtml}
    </section>

    <section class="section">
      <h2 class="section-title">Skills</h2>
      ${skillsHtml}
    </section>

    <section class="section">
      <h2 class="section-title">Work Experience</h2>
      ${experienceHtml}
    </section>

    ${
      cv.sections.projects
        ? `
    <section class="section">
      <h2 class="section-title">Projects</h2>
      ${projectsHtml}
    </section>
    `
        : ``
    }

    <section class="section">
      <h2 class="section-title">Education</h2>
      ${educationHtml}
    </section>

    ${
      cv.sections.certifications
        ? `
    <section class="section">
      <h2 class="section-title">Certifications</h2>
      ${certificationsHtml}
    </section>
    `
        : ``
    }

    ${
      cv.sections.awards
        ? `
    <section class="section">
      <h2 class="section-title">Awards</h2>
      ${awardsHtml}
    </section>
    `
        : ``
    }

    ${
      cv.sections.publications
        ? `
    <section class="section">
      <h2 class="section-title">Publications</h2>
      ${publicationsHtml}
    </section>
    `
        : ``
    }

    ${
      cv.sections.volunteering
        ? `
    <section class="section">
      <h2 class="section-title">Volunteering</h2>
      ${volunteeringHtml}
    </section>
    `
        : ``
    }
  </div>
</body>
</html>`;
}
