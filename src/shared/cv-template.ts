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

/* Page size is A4. Margins are applied via printToPDF options for_toggleable consistency. */
@page{ size: A4; margin: 0; }

.page{
  width:210mm;
  min-height:297mm;
  margin:16px auto;
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

  const skillsHtml = skills.length
    ? `<p class="p">${skills.map(escapeHtml).join(", ")}</p>`
    : `<p class="p" style="color:var(--muted)">List skills that match the roles you want (tools, languages, methods).</p>`;

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
      <h2 class="section-title">Work Experience</h2>
      ${experienceHtml}
    </section>

    <section class="section">
      <h2 class="section-title">Education</h2>
      ${educationHtml}
    </section>

    <section class="section">
      <h2 class="section-title">Skills</h2>
      ${skillsHtml}
    </section>
  </div>
</body>
</html>`;
}
