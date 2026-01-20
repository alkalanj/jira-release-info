import { Version3Client } from "jira.js";
import type { JiraConfig } from "./configuration";
import type { GithubSvc } from "./github-svc";
import chalk from "chalk";

interface Ticket {
  id: string;
  key: string;
  status: string | undefined;
  summary: string;
  assignee: string | undefined;
  devInfo: DevInfo;
}

interface PullRequest {
  id: string;
  name: string;
  status: string;
  url: string;
  repositoryUrl: string;
  author: string;
  destination: {
    branch: string;
  };
}

interface DevInfo {
  pullRequests: PullRequest[];
}

export function initJiraSvc(config: JiraConfig, githubSvc: GithubSvc, terse: boolean) {
  const jira = new Version3Client({
    host: config.jiraHost,
    authentication: {
      basic: {
        email: config.email,
        apiToken: config.apiToken,
      },
    },
  });

  async function getPrsGroupedByKey(releaseIds: string[], groupBy: string, includeAll: boolean) {
    const jql =
      `fixVersion in (${releaseIds.join(",")})` +
      (includeAll ? "" : ` and status in ("QA Passed", "Waiting for Release")`);
    const resp = await jira.issueSearch.searchForIssuesUsingJqlEnhancedSearch({
      jql,
      fields: ["status", "summary", "assignee", "status"],
      maxResults: 200,
    });

    const tickets: Ticket[] = [];
    for (const issue of resp.issues ?? []) {
      if (!terse)
        console.log(
          "Processing JIRA ticket: " + chalk.yellow.bold(issue.key) + " " + chalk.blueBright(issue.fields.summary),
        );
      tickets.push({
        id: issue.id,
        key: issue.key,
        status: issue.fields.status.name,
        summary: issue.fields.summary,
        assignee: issue.fields.assignee.emailAddress,
        devInfo: await fetchDevInfo(issue.id, includeAll),
      });
    }

    const prsByKey: Record<string, PullRequest[]> = {};
    let totalPrs = 0;

    for (const ticket of tickets) {
      for (const pr of ticket.devInfo.pullRequests) {
        const key = groupBy === "repo" ? pr.repositoryUrl : groupBy === "developer" ? pr.author : ticket.key;
        prsByKey[key] ??= [];
        prsByKey[key].push(pr);
        totalPrs++;
      }
    }

    if (!terse) console.log("Total PRs found: " + chalk.green.bold(totalPrs));

    return prsByKey;
  }

  const jiraAuth = `Basic ${Buffer.from(config.email + ":" + config.apiToken).toString("base64")}`;

  /**
   * Fetch development info using internal API. This info is not available through the official REST API.
   * https://jira.atlassian.com/browse/JSWCLOUD-16901
   */
  async function fetchDevInfo(issueId: string, includeAll: boolean): Promise<DevInfo> {
    const resp = await fetch(
      `${config.jiraHost}/rest/dev-status/latest/issue/detail` +
        `?issueId=${issueId}&applicationType=GitHub&dataType=branch`,
      {
        method: "GET",
        headers: {
          Authorization: jiraAuth,
          Accept: "application/json",
        },
      },
    );
    const data = (await resp.json()) as { detail: DevInfo[] };

    if (data.detail[0] === undefined) {
      return { pullRequests: [] };
    }

    const pullRequests = [];

    for (const pr of data.detail[0].pullRequests) {
      console.log(pr);
      const repo = pr.repositoryUrl.split("/").pop()!;
      const pullNumber = parseInt(pr.id.replace("#", ""));

      // Skip the PRs that are not merged to the 'develop' branch:
      if (!includeAll && (pr.status !== "MERGED" || pr.destination.branch !== "develop")) continue;

      // Clean up the PullRequest objects, retain only the interesting fields:
      pullRequests.push({
        id: pr.id,
        name: pr.name,
        status: pr.status,
        url: pr.url,
        repositoryUrl: pr.repositoryUrl,
        destination: {
          branch: pr.destination.branch,
        },
        // PR's author field in JIRA's dev info response is not reliable, need to fetch it from GitHub:
        author: await githubSvc.fetchGithubPrAuthor(repo, pullNumber),
      });
    }

    return { pullRequests };
  }

  return {
    getPrsGroupedByKey,
  };
}

export type JiraSvc = ReturnType<typeof initJiraSvc>;
