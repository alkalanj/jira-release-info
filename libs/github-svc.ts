import { Octokit } from "octokit";
import type { GithubConfig } from "./configuration";

export function initGithubSvc(config: GithubConfig) {
  const octokit = new Octokit({ auth: config.personalAccessToken });

  async function fetchGithubPrAuthor(repo: string, pullNumber: number): Promise<string> {
    const result = await octokit.rest.pulls.get({
      owner: config.repoOwner,
      repo,
      pull_number: pullNumber,
    });
    return result.data.user.login;
  }

  async function getFileContent(repo: string, path: string) {
    const result = await octokit.rest.repos.getContent({
      owner: config.repoOwner,
      repo,
      path,
      ref: "master",
    });
    if ("content" in result.data) {
      return Buffer.from(result.data.content, "base64").toString();
    }
    throw new Error(`Could not get content of ${repo} ${path}.`);
  }

  return {
    fetchGithubPrAuthor,
    getFileContent,
  };
}

export type GithubSvc = ReturnType<typeof initGithubSvc>;
