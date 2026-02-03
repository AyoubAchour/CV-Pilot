import { contextBridge, ipcRenderer } from 'electron';
import type { CvDocument } from './shared/cv-model';
import type {
	OpenAiCvSuggestions,
	OpenAiGenerateCvSuggestionsInput,
	OpenAiGenerateSkillsFromCvInput,
	OpenAiGenerateSkillsFromCvResult,
	OpenAiGenerateSummaryFromCvInput,
	OpenAiGenerateSummaryFromCvResult,
	OpenAiStatus,
	OpenAiTestResult,
} from "./shared/openai-types";
import type {
	GitHubBuildRepoContextPackInput,
	GitHubBuildRepoContextPackResult,
} from "./shared/repo-context-pack";

interface ProjectSummary {
	id: string;
	title: string;
	customTitle?: string;
	lastEdited: string;
	tags: string[];
	completion?: number;
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
	deleteProject: (projectId: string): Promise<void> =>
		ipcRenderer.invoke('cv:deleteProject', projectId),
	renameProject: (input: { projectId: string; customTitle: string }): Promise<{ title: string }> =>
		ipcRenderer.invoke('cv:renameProject', input),
	exportCvPdf: (input: ExportCvPdfInput): Promise<ExportCvPdfResult> =>
		ipcRenderer.invoke('cv:exportCvPdf', input),

	githubDisconnect: (): Promise<void> => ipcRenderer.invoke('cv:githubDisconnect'),
	githubBeginAuth: (input: { includePrivate?: boolean }): Promise<{ sessionId: string; userCode: string; verificationUri: string; expiresIn: number; interval: number }> =>
		ipcRenderer.invoke('cv:githubBeginAuth', input),
	githubPollAuth: (input: { sessionId: string }): Promise<{ status: 'pending' | 'authorized' | 'denied' | 'expired' | 'error'; interval?: number; message?: string }> =>
		ipcRenderer.invoke('cv:githubPollAuth', input),
	githubGetProfile: (): Promise<{ login: string; name: string | null; htmlUrl: string; blog: string | null; location: string | null }> =>
		ipcRenderer.invoke('cv:githubGetProfile'),
	githubListRepos: (input: { includePrivate?: boolean }): Promise<Array<{ id: number; name: string; fullName: string; private: boolean; htmlUrl: string; description: string | null; language: string | null; defaultBranch: string; updatedAt: string; pushedAt: string | null; owner: string }>> =>
		ipcRenderer.invoke('cv:githubListRepos', input),
	githubGetReadme: (input: { owner: string; repo: string }): Promise<{ text: string | null; truncated: boolean }> =>
		ipcRenderer.invoke('cv:githubGetReadme', input),
	githubBuildRepoContextPack: (input: GitHubBuildRepoContextPackInput): Promise<GitHubBuildRepoContextPackResult> =>
		ipcRenderer.invoke('cv:githubBuildRepoContextPack', input),

	openaiGetStatus: (): Promise<OpenAiStatus> => ipcRenderer.invoke("cv:openaiGetStatus"),
	openaiSetConfig: (input: { apiKey?: string; model?: string }): Promise<void> =>
		ipcRenderer.invoke("cv:openaiSetConfig", input),
	openaiClearConfig: (): Promise<void> => ipcRenderer.invoke("cv:openaiClearConfig"),
	openaiGenerateCvSuggestionsFromGitHub: (
		input: OpenAiGenerateCvSuggestionsInput
	): Promise<OpenAiCvSuggestions> =>
		ipcRenderer.invoke("cv:openaiGenerateCvSuggestionsFromGitHub", input),
	openaiGenerateSummaryFromCv: (
		input: OpenAiGenerateSummaryFromCvInput
	): Promise<OpenAiGenerateSummaryFromCvResult> =>
		ipcRenderer.invoke("cv:openaiGenerateSummaryFromCv", input),
	openaiGenerateSkillsFromCv: (
		input: OpenAiGenerateSkillsFromCvInput
	): Promise<OpenAiGenerateSkillsFromCvResult> =>
		ipcRenderer.invoke("cv:openaiGenerateSkillsFromCv", input),
	openaiTest: (input?: { apiKey?: string; model?: string }): Promise<OpenAiTestResult> =>
		ipcRenderer.invoke("cv:openaiTest", input),
});
