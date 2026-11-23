import { setTimeout as delay } from "node:timers/promises";
import userAgent from "./user-agent";

const lookupTimeout = 10000;
const retryDelay = 5000;

type OnionLocationLookup = { location: string | null } | { error: string };

/** Look up the header within a single time budget, including any retry. */
export default async function fetchOnionLocation(url: URL): Promise<OnionLocationLookup> {
	const signal = AbortSignal.timeout(lookupTimeout);

	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			if (attempt > 0) {
				await delay(retryDelay, undefined, { signal });
			}

			const response = await fetch(url, {
				method: "GET",
				headers: { "User-Agent": userAgent },
				signal
			});
			const location = response.headers.get("onion-location");

			// Only the header is needed. Release the connection even if the body keeps streaming.
			await response.body?.cancel();
			return { location };
		} catch {
			if (signal.aborted) {
				return { error: `Onion-Location lookup timed out after ${lookupTimeout / 1000}s for ${url.host}.` };
			}
		}
	}

	return { error: `Onion-Location lookup failed for ${url.host}.` };
}
