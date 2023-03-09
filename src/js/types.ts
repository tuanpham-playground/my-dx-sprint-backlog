export type Issue = {
  title: string;
  url: string;
  storyPoint?: string;
  status?: string;
};

export type ConfigGithub = {
  githubApiUrl: string;
  githubApiToken: string;
};

export type ConfigZenhub = {
  zenhubApiUrl: string;
  zenhubApiToken: string;
  workspaceName: string;
  workspaceId: string;
  repositoriesConnection: string;
};

export type ConfigBase = {
  populate(): void;
  show(): void;
  reset(): void;
  getSettingsForSave(): any;
};

export type DesktopBase = {
  lookupIssue(): void;
  show(): void;
  reset(): void;
  getSettingsForSave(): any;
};
