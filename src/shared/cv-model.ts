export interface CvBasics {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  links: string[];
  summary: string;
}

export interface CvExperience {
  company: string;
  role: string;
  location: string;
  start: string;
  end: string;
  highlights: string[];
}

export interface CvEducation {
  school: string;
  degree: string;
  location: string;
  start: string;
  end: string;
  highlights: string[];
}

export interface CvProject {
  title: string;
  date: string;
  link: string;
  highlights: string[];
}

export interface CvCertification {
  name: string;
  issuer: string;
  date: string;
  link: string;
  highlights: string[];
}

export interface CvAward {
  title: string;
  issuer: string;
  date: string;
  highlights: string[];
}

export interface CvPublication {
  title: string;
  venue: string;
  date: string;
  link: string;
  highlights: string[];
}

export interface CvVolunteering {
  organization: string;
  role: string;
  location: string;
  start: string;
  end: string;
  highlights: string[];
}

export interface CvSectionVisibility {
  projects: boolean;
  certifications: boolean;
  awards: boolean;
  publications: boolean;
  volunteering: boolean;
}

export interface CvDocument {
  schemaVersion: 1;
  basics: CvBasics;
  experience: CvExperience[];
  education: CvEducation[];
  sections: CvSectionVisibility;
  projects: CvProject[];
  certifications: CvCertification[];
  awards: CvAward[];
  publications: CvPublication[];
  volunteering: CvVolunteering[];
  skills: string[];
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeNonEmptyLines(value: unknown, fallback: string[] = [""]): string[] {
  const items = asStringArray(value).map((v) => v.trim());
  const filtered = items.filter((v) => v.length > 0);
  return filtered.length > 0 ? filtered : fallback;
}

function normalizeSectionVisibility(value: unknown): CvSectionVisibility {
  const record = asRecord(value) ?? {};
  return {
    projects: asBoolean(record.projects) ?? false,
    certifications: asBoolean(record.certifications) ?? false,
    awards: asBoolean(record.awards) ?? false,
    publications: asBoolean(record.publications) ?? false,
    volunteering: asBoolean(record.volunteering) ?? false,
  };
}

function normalizeProjects(value: unknown): CvProject[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const mapped = value
    .map((item) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }

      const highlights = normalizeNonEmptyLines(record.highlights, [""]);
      const hasHighlights = highlights.some((h) => h.trim().length > 0);
      const title = asString(record.title) ?? "";
      const date = asString(record.date) ?? "";
      const link = asString(record.link) ?? "";

      if ([title, date, link].map((v) => v.trim()).join("").length === 0 && !hasHighlights) {
        return null;
      }

      const normalized: CvProject = {
        title,
        date,
        link,
        highlights,
      };

      return normalized;
    })
    .filter((item): item is CvProject => item !== null);

  return mapped;
}

function normalizeCertifications(value: unknown): CvCertification[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const mapped = value
    .map((item) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }

      const highlights = normalizeNonEmptyLines(record.highlights, [""]);
      const hasHighlights = highlights.some((h) => h.trim().length > 0);

      const name = asString(record.name) ?? "";
      const issuer = asString(record.issuer) ?? "";
      const date = asString(record.date) ?? "";
      const link = asString(record.link) ?? "";

      if ([name, issuer, date, link].map((v) => v.trim()).join("").length === 0 && !hasHighlights) {
        return null;
      }

      const normalized: CvCertification = {
        name,
        issuer,
        date,
        link,
        highlights,
      };

      return normalized;
    })
    .filter((item): item is CvCertification => item !== null);

  return mapped;
}

function normalizeAwards(value: unknown): CvAward[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const mapped = value
    .map((item) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }

      const highlights = normalizeNonEmptyLines(record.highlights, [""]);
      const hasHighlights = highlights.some((h) => h.trim().length > 0);

      const title = asString(record.title) ?? "";
      const issuer = asString(record.issuer) ?? "";
      const date = asString(record.date) ?? "";

      if ([title, issuer, date].map((v) => v.trim()).join("").length === 0 && !hasHighlights) {
        return null;
      }

      const normalized: CvAward = {
        title,
        issuer,
        date,
        highlights,
      };

      return normalized;
    })
    .filter((item): item is CvAward => item !== null);

  return mapped;
}

function normalizePublications(value: unknown): CvPublication[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const mapped = value
    .map((item) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }

      const highlights = normalizeNonEmptyLines(record.highlights, [""]);
      const hasHighlights = highlights.some((h) => h.trim().length > 0);

      const title = asString(record.title) ?? "";
      const venue = asString(record.venue) ?? "";
      const date = asString(record.date) ?? "";
      const link = asString(record.link) ?? "";

      if ([title, venue, date, link].map((v) => v.trim()).join("").length === 0 && !hasHighlights) {
        return null;
      }

      const normalized: CvPublication = {
        title,
        venue,
        date,
        link,
        highlights,
      };

      return normalized;
    })
    .filter((item): item is CvPublication => item !== null);

  return mapped;
}

function normalizeVolunteering(value: unknown): CvVolunteering[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const mapped = value
    .map((item) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }

      const highlights = normalizeNonEmptyLines(record.highlights, [""]);
      const hasHighlights = highlights.some((h) => h.trim().length > 0);

      const organization = asString(record.organization) ?? "";
      const role = asString(record.role) ?? "";
      const location = asString(record.location) ?? "";
      const start = asString(record.start) ?? "";
      const end = asString(record.end) ?? "";

      if (
        [organization, role, location, start, end].map((v) => v.trim()).join("").length === 0 &&
        !hasHighlights
      ) {
        return null;
      }

      const normalized: CvVolunteering = {
        organization,
        role,
        location,
        start,
        end,
        highlights,
      };

      return normalized;
    })
    .filter((item): item is CvVolunteering => item !== null);

  return mapped;
}

function normalizeExperience(value: unknown): CvExperience[] {
  if (!Array.isArray(value)) {
    return [
      {
        company: "",
        role: "",
        location: "",
        start: "",
        end: "",
        highlights: [""],
      },
    ];
  }

  const mapped = value
    .map((item) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }

      const normalized: CvExperience = {
        company: asString(record.company) ?? "",
        role: asString(record.role) ?? "",
        location: asString(record.location) ?? "",
        start: asString(record.start) ?? "",
        end: asString(record.end) ?? "",
        highlights: normalizeNonEmptyLines(record.highlights, [""]),
      };

      return normalized;
    })
    .filter((item): item is CvExperience => item !== null);

  return mapped.length > 0
    ? mapped
    : [
        {
          company: "",
          role: "",
          location: "",
          start: "",
          end: "",
          highlights: [""],
        },
      ];
}

function normalizeEducation(value: unknown): CvEducation[] {
  if (!Array.isArray(value)) {
    return [
      {
        school: "",
        degree: "",
        location: "",
        start: "",
        end: "",
        highlights: [""],
      },
    ];
  }

  const mapped = value
    .map((item) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }

      const normalized: CvEducation = {
        school: asString(record.school) ?? "",
        degree: asString(record.degree) ?? "",
        location: asString(record.location) ?? "",
        start: asString(record.start) ?? "",
        end: asString(record.end) ?? "",
        highlights: normalizeNonEmptyLines(record.highlights, [""]),
      };

      return normalized;
    })
    .filter((item): item is CvEducation => item !== null);

  return mapped.length > 0
    ? mapped
    : [
        {
          school: "",
          degree: "",
          location: "",
          start: "",
          end: "",
          highlights: [""],
        },
      ];
}

export function normalizeCvDocument(input: unknown): CvDocument {
  const blank = createBlankCv();
  const record = asRecord(input);
  if (!record) {
    return blank;
  }

  // Future-proofing: accept schemaVersion 1 or missing.
  const schemaVersion = record.schemaVersion;
  if (schemaVersion !== undefined && schemaVersion !== 1) {
    return blank;
  }

  const basics = asRecord(record.basics) ?? {};

  const links = normalizeNonEmptyLines(basics.links, [""]);
  const skills = normalizeNonEmptyLines(record.skills, [""]);

  const sections = normalizeSectionVisibility(record.sections);

  // Back-compat: if any optional section has content but the toggle is missing/false,
  // enable it so the content is visible in the UI.
  const projects = normalizeProjects(record.projects);
  const certifications = normalizeCertifications(record.certifications);
  const awards = normalizeAwards(record.awards);
  const publications = normalizePublications(record.publications);
  const volunteering = normalizeVolunteering(record.volunteering);

  const inferredSections: CvSectionVisibility = {
    projects: sections.projects || projects.length > 0,
    certifications: sections.certifications || certifications.length > 0,
    awards: sections.awards || awards.length > 0,
    publications: sections.publications || publications.length > 0,
    volunteering: sections.volunteering || volunteering.length > 0,
  };

  return {
    schemaVersion: 1,
    basics: {
      fullName: asString(basics.fullName) ?? "",
      headline: asString(basics.headline) ?? "",
      email: asString(basics.email) ?? "",
      phone: asString(basics.phone) ?? "",
      location: asString(basics.location) ?? "",
      links,
      summary: asString(basics.summary) ?? "",
    },
    experience: normalizeExperience(record.experience),
    education: normalizeEducation(record.education),
    sections: inferredSections,
    projects,
    certifications,
    awards,
    publications,
    volunteering,
    skills,
  };
}

export function createBlankCv(): CvDocument {
  return {
    schemaVersion: 1,
    basics: {
      fullName: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
      links: [""],
      summary: "",
    },
    experience: [
      {
        company: "",
        role: "",
        location: "",
        start: "",
        end: "",
        highlights: [""],
      },
    ],
    education: [
      {
        school: "",
        degree: "",
        location: "",
        start: "",
        end: "",
        highlights: [""],
      },
    ],
    sections: {
      projects: false,
      certifications: false,
      awards: false,
      publications: false,
      volunteering: false,
    },
    projects: [],
    certifications: [],
    awards: [],
    publications: [],
    volunteering: [],
    skills: [""],
  };
}
