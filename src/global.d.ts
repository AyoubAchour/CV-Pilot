export {};

import type { CvDocument } from "./shared/cv-model";

declare module "*?url" {
  const src: string;
  export default src;
}

declare global {
  interface ProjectSummary {
    id: string;
    title: string;
    lastEdited: string;
    tags: string[];
  }

  interface CreateBlankCvProjectResult {
    project: ProjectSummary;
    cv: CvDocument;
  }

  interface SaveProjectCvInput {
    projectId: string;
    cv: CvDocument;
  }

  interface ExportCvPdfInput {
    projectId: string;
    cv: CvDocument;
    suggestedFileName?: string;
  }

  type ExportCvPdfResult =
    | { canceled: true }
    | {
        canceled: false;
        savedPath: string;
      };

  interface Window {
    cvPilot: {
      listProjects: () => Promise<ProjectSummary[]>;

      createBlankCvProject: () => Promise<CreateBlankCvProjectResult>;
      getProjectCv: (projectId: string) => Promise<CvDocument>;
      saveProjectCv: (input: SaveProjectCvInput) => Promise<void>;
      exportCvPdf: (input: ExportCvPdfInput) => Promise<ExportCvPdfResult>;
    };
  }
}
