import type {
  CvAward,
  CvCertification,
  CvDocument,
  CvEducation,
  CvExperience,
  CvProject,
  CvPublication,
  CvVolunteering,
} from "../../../shared/cv-model";

export function toLines(value: string): string[] {
  return value
    .split(/\r?\n/g)
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

export function fromLines(values: string[]): string {
  return (values ?? []).join("\n");
}

export function cloneCv(cv: CvDocument): CvDocument {
  // Keep this explicit; we want deterministic shape.
  return {
    schemaVersion: 1,
    basics: {
      fullName: cv.basics.fullName,
      headline: cv.basics.headline,
      email: cv.basics.email,
      phone: cv.basics.phone,
      location: cv.basics.location,
      links: [...(cv.basics.links ?? [])],
      summary: cv.basics.summary,
    },
    experience: (cv.experience ?? []).map((e) => ({
      company: e.company,
      role: e.role,
      location: e.location,
      start: e.start,
      end: e.end,
      highlights: [...(e.highlights ?? [])],
    })),
    education: (cv.education ?? []).map((e) => ({
      school: e.school,
      degree: e.degree,
      location: e.location,
      start: e.start,
      end: e.end,
      highlights: [...(e.highlights ?? [])],
    })),
    sections: {
      projects: cv.sections?.projects ?? false,
      certifications: cv.sections?.certifications ?? false,
      awards: cv.sections?.awards ?? false,
      publications: cv.sections?.publications ?? false,
      volunteering: cv.sections?.volunteering ?? false,
    },
    projects: (cv.projects ?? []).map((p) => ({
      title: p.title,
      date: p.date,
      link: p.link,
      highlights: [...(p.highlights ?? [])],
    })),
    certifications: (cv.certifications ?? []).map((c) => ({
      name: c.name,
      issuer: c.issuer,
      date: c.date,
      link: c.link,
      highlights: [...(c.highlights ?? [])],
    })),
    awards: (cv.awards ?? []).map((a) => ({
      title: a.title,
      issuer: a.issuer,
      date: a.date,
      highlights: [...(a.highlights ?? [])],
    })),
    publications: (cv.publications ?? []).map((p) => ({
      title: p.title,
      venue: p.venue,
      date: p.date,
      link: p.link,
      highlights: [...(p.highlights ?? [])],
    })),
    volunteering: (cv.volunteering ?? []).map((v) => ({
      organization: v.organization,
      role: v.role,
      location: v.location,
      start: v.start,
      end: v.end,
      highlights: [...(v.highlights ?? [])],
    })),
    skills: [...(cv.skills ?? [])],
  };
}

export function emptyExperience(): CvExperience {
  return {
    company: "",
    role: "",
    location: "",
    start: "",
    end: "",
    highlights: [""],
  };
}

export function emptyEducation(): CvEducation {
  return {
    school: "",
    degree: "",
    location: "",
    start: "",
    end: "",
    highlights: [""],
  };
}

export function emptyProject(): CvProject {
  return {
    title: "",
    date: "",
    link: "",
    highlights: [""],
  };
}

export function emptyCertification(): CvCertification {
  return {
    name: "",
    issuer: "",
    date: "",
    link: "",
    highlights: [""],
  };
}

export function emptyAward(): CvAward {
  return {
    title: "",
    issuer: "",
    date: "",
    highlights: [""],
  };
}

export function emptyPublication(): CvPublication {
  return {
    title: "",
    venue: "",
    date: "",
    link: "",
    highlights: [""],
  };
}

export function emptyVolunteering(): CvVolunteering {
  return {
    organization: "",
    role: "",
    location: "",
    start: "",
    end: "",
    highlights: [""],
  };
}

export const dash = "–";

export const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export function experienceEntryLabel(entry: CvExperience, index: number): string {
  const left = [entry.role?.trim(), entry.company?.trim()]
    .filter(Boolean)
    .join(` ${dash} `);
  const dates = [entry.start?.trim(), entry.end?.trim()].filter(Boolean).join(dash);
  const base = left || `Entry ${index + 1}`;
  return dates ? `${base} (${dates})` : base;
}

export function educationEntryLabel(entry: CvEducation, index: number): string {
  const left = [entry.degree?.trim(), entry.school?.trim()]
    .filter(Boolean)
    .join(` ${dash} `);
  const dates = [entry.start?.trim(), entry.end?.trim()].filter(Boolean).join(dash);
  const base = left || `Entry ${index + 1}`;
  return dates ? `${base} (${dates})` : base;
}
