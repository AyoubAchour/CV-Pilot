import { contextBridge, ipcRenderer } from 'electron';
import type { CvDocument } from './shared/cv-model';

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

contextBridge.exposeInMainWorld('cvPilot', {
	importCvPdf: (): Promise<ImportCvPdfResult> => ipcRenderer.invoke('cv:importPdf'),
	saveProjectExtract: (input: SaveProjectExtractInput): Promise<void> =>
		ipcRenderer.invoke('cv:saveProjectExtract', input),
	listProjects: (): Promise<ProjectSummary[]> => ipcRenderer.invoke('cv:listProjects'),
	getProjectPdf: (projectId: string): Promise<Uint8Array> =>
		ipcRenderer.invoke('cv:getProjectPdf', projectId),
	getProjectExtractText: (projectId: string): Promise<string> =>
		ipcRenderer.invoke('cv:getProjectExtractText', projectId),
	createBlankCvProject: (): Promise<CreateBlankCvProjectResult> =>
		ipcRenderer.invoke('cv:createBlankCvProject'),
	getProjectCv: (projectId: string): Promise<CvDocument> =>
		ipcRenderer.invoke('cv:getProjectCv', projectId),
	saveProjectCv: (input: SaveProjectCvInput): Promise<void> =>
		ipcRenderer.invoke('cv:saveProjectCv', input),
	exportCvPdf: (input: ExportCvPdfInput): Promise<ExportCvPdfResult> =>
		ipcRenderer.invoke('cv:exportCvPdf', input),
});
