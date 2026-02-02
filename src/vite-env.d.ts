/// <reference types="vite/client" />

// Defined at build time in `vite.main.config.ts`.
declare const __VITA_GITHUB_CLIENT_ID__: string;
declare const __CV_PILOT_GITHUB_CLIENT_ID__: string;

declare module "*?url" {
  const src: string;
  export default src;
}
