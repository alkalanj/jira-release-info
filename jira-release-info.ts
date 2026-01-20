#!/usr/bin/env -S npx tsx

import { Command, Option } from "@commander-js/extra-typings";
import chalk from "chalk";
import { initJiraSvc } from "./libs/jira-svc";
import { initGithubSvc } from "./libs/github-svc";
import type { Config } from "./libs/configuration";
import configJson from "./.config.json";

const config: Config = configJson satisfies Config;

async function action(releaseIds: string[], opts: Opts) {
  // Initialize clients:
  const githubSvc = initGithubSvc(config.github);
  const jiraSvc = initJiraSvc(config.jira, githubSvc, opts.terse);

  const prsByKey = await jiraSvc.getPrsGroupedByKey(releaseIds, opts.groupBy, opts.all);
  console.log(JSON.stringify(prsByKey, null, 4));
}

interface Opts {
  groupBy: string;
  all: boolean;
  terse: boolean;
}

const program = new Command("jira-release-info")
  .description(
    "Prepares development info for a JIRA release.\n" +
      "Unless specified otherwise, this criteria applies:\n" +
      "  * tickets in 'QA Passed' and 'Waiting for Release' statuses\n" +
      "  * PRs merged to 'develop' branch",
  )
  .argument("<release-ids...>", "IDs of the JIRA releases (fix versions) separated by spaces")
  .addOption(
    new Option("-g, --group-by <field>", "group results by field")
      .choices(["developer", "repo", "ticket"] as const)
      .default("repo"),
  )
  .option("-a, --all", "include all tickets and PRs, regardless of their status", false)
  .option("-t, --terse", "do not print debug info", false)
  .action(action)
  .showHelpAfterError()
  .configureOutput({
    writeErr(message: string) {
      process.stderr.write(chalk.red(message));
    },
    writeOut(message: string) {
      process.stdout.write(message);
    },
  });

program.parse();
