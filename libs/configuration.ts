export type JiraConfig = {
  email: string;
  apiToken: string;
  jiraHost: string;
};

export type GithubConfig = {
  personalAccessToken: string;
  repoOwner: string;
};

export type Config = {
  github: GithubConfig;
  jira: JiraConfig;
};
