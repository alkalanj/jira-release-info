# JIRA Release Info

A script to prepare the development info (a list of pull requests)
about the particular JIRA releases. The PRs can be grouped by
repositories, developers or JIRA tickets.

Unless specified otherwise, these criteria apply:
* tickets in 'QA Passed' and 'Waiting for Release' statuses
* PRs merged to 'develop' branch

## Requirements

Node.js needs to be installed.

## Installation

```shell
npm install
```

Or

```shell
pnpm install
```

## Configuration

The following properties need to be added to the `.config.json` file:

| Environment Variable         | Description                                                                                                    |
|------------------------------|----------------------------------------------------------------------------------------------------------------|
| `github.personalAccessToken` | GitHub personal access token (classic), available here: https://github.com/settings/tokens                     |
| `github.repoOwner`           | Owner of repositories; organization or account name                                                            |
| `jira.email`                 | JIRA account email address                                                                                     |
| `jira.apiToken`              | JIRA API token for authentication, available here: https://id.atlassian.com/manage-profile/security/api-tokens |
| `jira.host`                  | JIRA host URL (e.g., https://companyname.atlassian.net)                                                        |

Copy the provided `.config.example.json` file to `.config.json` and populate the values.

## Usage

Running on Mac/Linux/WSL:
```shell
./jira-release-info.ts [options] <release-ids...>
```

Running on Windows (or if the command above does not work):
```shell
npx tsx jira-release-info.ts [options] <release-ids...>
```

This also works if you're using Node.js version >= 22.18.0:
```shell
node jira-release-info.ts [options] <release-ids...>
```

### Arguments

| Argument       | Description                                                                                                            |
|----------------|------------------------------------------------------------------------------------------------------------------------|
| `release-ids`  | IDs of the JIRA releases (fix versions) separated by spaces. Release IDs can be copied from the URL of a JIRA release. |

### Options

| Environment Variable       | Description                                                                      |
|----------------------------|----------------------------------------------------------------------------------|
| `-g`, `--group-by <field>` | group results by field (choices: "developer", "repo", "ticket", default: "repo") |
| `-a`, `--all`              | include all tickets and PRs, regardless of their status (default: false)         |
| `-t`, `--terse`            | do not print debug info (default: false)                                         |
| `-h`, `--help`             | display help for command                                                         |

### Example

This fetches PRs from two JIRA releases
and groups them by developers (authors of PRs):
```shell
./jira-release-info.ts -g developer 15756 15856
```

Options can also be placed at the end:
```shell
./jira-release-info.ts 15756 15856 -g developer
```
