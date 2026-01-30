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

export interface CvDocument {
  schemaVersion: 1;
  basics: CvBasics;
  experience: CvExperience[];
  education: CvEducation[];
  skills: string[];
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
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
    skills: [""],
  };
}
