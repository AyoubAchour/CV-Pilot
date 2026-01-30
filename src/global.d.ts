export {};

import type { CvDocument } from "./shared/cv-model";

declare module "*?url" {
  const src: string;
  export default src;
}

declare module "pdfjs-dist/build/pdf.worker.mjs?url" {
  const src: string;
  export default src;
}

declare module "pdfjs-dist/build/pdf.worker.min.mjs?url" {
  const src: string;
  export default src;
}

declare global {
  interface ImportCvPdfResult {
    canceled: boolean;
    projectId?: string;
    fileName?: string;
    pdfBytes?: Uint8Array;
  }

  interface SaveProjectExtractInput {
    projectId: string;
    text: string;
    usedOcr: boolean;
    pageCount: number;
  }

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
      importCvPdf: () => Promise<ImportCvPdfResult>;
      saveProjectExtract: (input: SaveProjectExtractInput) => Promise<void>;
      listProjects: () => Promise<ProjectSummary[]>;
      getProjectPdf: (projectId: string) => Promise<Uint8Array>;
      getProjectExtractText: (projectId: string) => Promise<string>;

      createBlankCvProject: () => Promise<CreateBlankCvProjectResult>;
      getProjectCv: (projectId: string) => Promise<CvDocument>;
      saveProjectCv: (input: SaveProjectCvInput) => Promise<void>;
      exportCvPdf: (input: ExportCvPdfInput) => Promise<ExportCvPdfResult>;
    };
  }
}
