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
  --ink:#0f172a;
  --muted:#475569;
  --rule:#e2e8f0;
  --bg:#f1f5f9;
}
*{box-sizing:border-box;}
html,body{height:100%;}
body{
  margin:0;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
  color:var(--ink);
  background:var(--bg);
}
@page{ size: A4; margin: 0; }
.page{
  width:210mm;
  min-height:297mm;
  margin:16px auto;
  background:#fff;
  box-shadow: 0 10px 30px rgba(2,6,23,.12);
  border: 1px solid rgba(2,6,23,.06);
  padding: 14mm 14mm 12mm 14mm;
}
.header{
  display:flex;
  gap:16px;
  align-items:flex-start;
  justify-content:space-between;
}
.name{font-size:26px; font-weight:750; letter-spacing:-.02em; line-height:1.05;}
.headline{margin-top:6px; color:var(--muted); font-size:13px; line-height:1.35;}
.contact{margin-top:10px; color:var(--muted); font-size:11.5px; line-height:1.4;}
.contact a{color:inherit; text-decoration:none; border-bottom:1px solid rgba(71,85,105,.35);}
.rule{height:1px; background:var(--rule); margin:12px 0 14px;}
.section{margin-top:12px;}
.section-title{
  font-size:12px;
  font-weight:750;
  text-transform:uppercase;
  letter-spacing:.08em;
  color:var(--muted);
  margin:0 0 8px;
}
.p{
  font-size:12.5px;
  line-height:1.55;
  margin:0;
}
.item{margin:0 0 10px;}
.item-head{display:flex; justify-content:space-between; gap:12px; align-items:baseline;}
.item-title{font-size:13px; font-weight:700;}
.item-meta{font-size:11.5px; color:var(--muted); white-space:nowrap;}
.item-sub{margin-top:3px; font-size:12px; color:var(--muted);}
.ul{margin:6px 0 0 16px; padding:0;}
.ul li{margin:2px 0; font-size:12px; line-height:1.45;}
.badges{display:flex; flex-wrap:wrap; gap:6px;}
.badge{font-size:11px; padding:4px 8px; border:1px solid var(--rule); border-radius:999px; color:var(--ink); background:#fff;}
@media print {
  body{ background:#fff; }
  .page{ margin:0; box-shadow:none; border:none; }
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
    .join(" · ");

  const contactLine =
    contactParts.map(escapeHtml).join(" · ") +
    (contactLinks ? (contactParts.length ? " · " : "") + contactLinks : "");

  const summaryHtml = cv.basics.summary.trim()
    ? `<p class="p">${escapeHtml(cv.basics.summary.trim())}</p>`
    : `<p class="p" style="color:var(--muted)">Write a short summary highlighting your impact and strengths.</p>`;

  const experienceHtml = experience.length
    ? experience
        .map((e) => {
          const highlights = nonEmptyLines(e.highlights ?? []);
          const metaParts = nonEmptyLines([
            [e.start?.trim(), e.end?.trim()].filter(Boolean).join(" – "),
            e.location,
          ]);

          return `
            <div class="item">
              <div class="item-head">
                <div class="item-title">${escapeHtml(
                  [e.role, e.company].filter((v) => (v ?? "").trim().length > 0).join(" — ")
                )}</div>
                <div class="item-meta">${escapeHtml(metaParts.join(" · "))}</div>
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
            [e.start?.trim(), e.end?.trim()].filter(Boolean).join(" – "),
            e.location,
          ]);

          return `
            <div class="item">
              <div class="item-head">
                <div class="item-title">${escapeHtml(
                  [e.degree, e.school].filter((v) => (v ?? "").trim().length > 0).join(" — ")
                )}</div>
                <div class="item-meta">${escapeHtml(metaParts.join(" · "))}</div>
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
    ? `<div class="badges">${skills
        .map((s) => `<span class="badge">${escapeHtml(s)}</span>`)
        .join("")}</div>`
    : `<p class="p" style="color:var(--muted)">Add a few skills that match the roles you want.</p>`;

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
    <header class="header">
      <div>
        <div class="name">${escapeHtml(cv.basics.fullName.trim() || "Your Name")}</div>
        <div class="headline">${escapeHtml(cv.basics.headline.trim() || "Role · Specialty · What you’re great at")}</div>
        <div class="contact">${contactLine || "Email · Phone · Location · Links"}</div>
      </div>
    </header>

    <div class="rule"></div>

    <section class="section">
      <h2 class="section-title">Summary</h2>
      ${summaryHtml}
    </section>

    <section class="section">
      <h2 class="section-title">Experience</h2>
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
