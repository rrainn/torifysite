import { RunOn } from "../Rule";

import * as path from "path";

export default function check(runOn: RunOn[], pathString: string): boolean {
	if (runOn.length === 0) {
		return true;
	}

	const filePath = path.parse(pathString);

	return runOn.every((runOn) => {
		if ("filePaths" in runOn) {
			if (runOn.filePaths.some((filePathString) => filePathString === `${path.sep}${pathString}`)) {
				return true;
			}
		}

		if ("fileExtensions" in runOn) {
			if (runOn.fileExtensions.some((fileExtension) => fileExtension === filePath.ext.slice(1))) {
				return true;
			}
		}

		return false;
	});
}
