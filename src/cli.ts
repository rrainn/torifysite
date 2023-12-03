#!/usr/bin/env node

import { program } from "commander";
import { TorifySite, TorifySiteOptions } from "./index";
import { CompleteViolation } from "./Rule";
import * as pathPkg from "path";
import * as fs from "fs";

const packageJSON = require("../package.json");

program
	.name(packageJSON.name)
	.version(packageJSON.version)
	.description(packageJSON.description);

program
	.argument("<path>", "Specify the path to the directory to check.")
	.option("-f, --fix", "Fix violations automatically.", false)
	.option("-r, --rules <rules>", "Specify which rules to run. If not specified, all default rules will be run.", (value) => value.split(","), [])
	.option("-i, --ignore <ignore>", "Specify which rules to ignore. If not specified, no rules will be ignored.", (value) => value.split(","), [])
	.option("-e, --exclude <exclude>", "Specify which files to exclude. If not specified, no files will be excluded.", (value) => value.split(","), [])
	.option("--known-onion-locations <knownOnionLocations>", "Specify a JSON file of known onion hosts and their locations. The key being the original clearnet host, and the value being the onion host.", (value) => {
		return JSON.parse(fs.readFileSync(pathPkg.isAbsolute(value) ? value : pathPkg.join(process.cwd(), value)).toString());
	}, {});

program.parse(process.argv);

const options = program.opts();
const path = program.args[0];

(async () => {
	const instance = new TorifySite(pathPkg.join(process.cwd(), path), (options as TorifySiteOptions));
	const violations: CompleteViolation[] = await instance.run();

	if (violations.length > 0) {
		violations.forEach((violation: any) => {
			console.error(`${violation.path}:${violation.line ?? ""}:${violation.column ?? ""} [${violation.rule.id}] ${violation.message}`);
		});
		process.exit(1);
	}
})();
