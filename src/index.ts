import { promises as fs } from "fs";
import * as path from "path";
import { allRules } from "./rules/index";
import runOnCheck from "./utils/check-runon";
import { CompleteViolation, Rule } from "./Rule";

export class TorifySite {
	path: string;
	options: TorifySiteOptions;

	constructor(path: string, options: TorifySiteOptions) {
		this.path = path;
		this.options = options;
	}

	get rules() {
		return allRules.filter((rule) => {
			if (this.options.rules.length === 0) {
				return true;
			}

			return this.options.rules.some((ruleName) => ruleName === rule.id);
		}).filter((rule) => {
			if (this.options.ignore.length === 0) {
				return true;
			}

			return !this.options.ignore.some((ruleName) => ruleName === rule.id);
		});
	}

	async #runRule(rule: Rule, pathString: string, fileContents: Buffer): Promise<CompleteViolation[]> {
		if (this.options.fix && rule.fix !== undefined) {
			const newContents = await rule.fix?.(pathString, fileContents);
			await fs.writeFile(pathString, newContents);
			return [];
		} else {
			const violations = await rule.check?.(pathString, fileContents);
			if (violations) {
				return violations.map((violation) => {
					return {
						...violation,
						"path": pathString,
						"rule": rule
					};
				});
			} else {
				return [];
			}
		}
	}
	async #handleFile(pathString: string): Promise<CompleteViolation[]> {
		const rules = this.rules.filter((rule) => {
			const relativePath = path.relative(this.path, pathString);
			return runOnCheck(rule.runOn, relativePath);
		});

		return (await Promise.all(rules.map(async (rule) => {
			return this.#runRule(rule, pathString, await fs.readFile(pathString));
		}))).flat();
	}
	async #handleDirectory(pathString: string): Promise<CompleteViolation[]> {
		const files = await fs.readdir(pathString);
		return (await Promise.all(files.map(async (file) => {
			return await this.#handle(path.join(pathString, file));
		}))).flat();
	}
	async #handle(pathString: string): Promise<CompleteViolation[]> {
		if (await this.#isDirectory(pathString)) {
			return await this.#handleDirectory(pathString);
		} else {
			return await this.#handleFile(pathString);
		}
	}

	#isDirectory(pathString: string): Promise<boolean> {
		return fs.stat(pathString).then((stats) => stats.isDirectory());
	}

	async run(): Promise<CompleteViolation[]> {
		return await this.#handle(this.path);
	}
}

export interface TorifySiteOptions {
	fix: boolean;
	rules: string[];
	ignore: string[];
	exclude: string[];
}
