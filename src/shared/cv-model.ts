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
