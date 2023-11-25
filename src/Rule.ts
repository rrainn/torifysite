export interface Rule {
	id: string;
	description: string;
	/**
	 * If this rule should be run by default. If this is set to `false`, the rule will not be run unless it is explicitly enabled. If this is set to `"fix"`, the rule will be run and any errors will be fixed. If this is set to `"warn"`, the rule will be run and any errors will be reported as warnings. If this is set to `"error"`, the rule will be run and any errors will be reported as errors.
	 */
	default: false | "fix" | "warn" | "error";

	/**
	 * This rule will only be run if **all** the RunOn rules are met.
	 */
	runOn: RunOn[];

	/**
	 * Check to see if this rule is violated.
	 * @param path The path to the file.
	 * @param contents The contents of the file.
	 * @returns An array of violations. If no violations are found, an empty array should be returned.
	 */
	check?(path: string, contents: Buffer): Promise<Violation[]>;

	/**
	 * Fix this rule.
	 * @param path The path to the file.
	 * @param contents The contents of the file.
	 * @returns The fixed contents of the file.
	 */
	fix?(path: string, contents: Buffer): Promise<Buffer>;
}

export interface Violation {
	"line"?: number;
	"column"?: number;
	"message": string;
}

export interface CompleteViolation extends Violation {
	"path": string;
	"rule": Rule;
}

export type RunOn = {
	"fileExtensions": string[];
} | {
	"filePaths": string[];
} | {
	"fileExtensions": string[];
	"filePaths": string[];
};
