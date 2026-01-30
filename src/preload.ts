import { contextBridge, ipcRenderer } from 'electron';
import type { CvDocument } from './shared/cv-model';

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
	listProjects: (): Promise<ProjectSummary[]> => ipcRenderer.invoke('cv:listProjects'),
	createBlankCvProject: (): Promise<CreateBlankCvProjectResult> =>
		ipcRenderer.invoke('cv:createBlankCvProject'),
	getProjectCv: (projectId: string): Promise<CvDocument> =>
		ipcRenderer.invoke('cv:getProjectCv', projectId),
	saveProjectCv: (input: SaveProjectCvInput): Promise<void> =>
		ipcRenderer.invoke('cv:saveProjectCv', input),
	exportCvPdf: (input: ExportCvPdfInput): Promise<ExportCvPdfResult> =>
		ipcRenderer.invoke('cv:exportCvPdf', input),
});
