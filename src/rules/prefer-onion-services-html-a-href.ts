import { Rule, Violation } from "../Rule";

import * as cheerio from "cheerio";
import * as url from "url";
import userAgent from "../utils/user-agent";
import fetchCmd from "../utils/fetch";

const ignoreDomains = [
	"twitter.com"
];

const rule: Rule = {
	"id": "prefer-onion-services-a-href",
	"description": "Prefer onion services over clearnet domains on links.",
	"default": "warn",

	"runOn": [
		{
			"fileExtensions": ["html", "htm"]
		}
	],

	"check": async (path, contents, options): Promise<Violation[]> => {
		const $ = cheerio.load(contents.toString());

		const violations: Violation[] = (await Promise.all($("a").toArray().map(async (e) => {
			const href = $(e).attr("href");

			if (!href) {
				// Not violated if there is no href.
				return;
			}
			if (href.startsWith("#") || href.startsWith("/")) {
				// Not violated if the href starts with a hash or slash.
				return;
			}

			let parsed: url.URL;
			try {
				parsed = new url.URL(href);
			} catch (error) {
				console.warn(`Failed to parse URL ${href}.`);
				return;
			}
			if (parsed.hostname.endsWith(".onion")) {
				// Not violated if the hostname is already an onion service.
				return;
			}

			if (ignoreDomains.some((domain) => parsed.hostname.includes(domain))) {
				return;
			}

			if (parsed.protocol === "http:" || parsed.protocol === "https:") {
				let onionLocation;

				// Make request to the clearnet domain and see if it redirects to an onion service.
				const knownOnionLocation = options.knownOnionLocations[parsed.origin];
				if (knownOnionLocation) {
					const knownOnionLocationURL = new url.URL(knownOnionLocation);
					parsed.hostname = knownOnionLocationURL.hostname;
					parsed.protocol = knownOnionLocationURL.protocol;

					onionLocation = parsed.toString();
				} else {
					let response;
					try {
						response = await fetchCmd(href, {
							"method": "GET",
							"headers": {
								"User-Agent": userAgent
							}
						});
					} catch (error) {
						return {
							"message": `Failed to fetch ${href}.`
						};
					}

					onionLocation = response.headers.get("onion-location");
				}

				if (onionLocation) {
					return {
						"message": `Using clearnet domain ${href} instead of onion service ${onionLocation}.`
					};
				}
			}

			return;
		}))).filter((e) => typeof e !== "undefined" && Boolean(e)) as {"message": string}[];

		return violations;
	},
	"fix": async (path, contents, options): Promise<Buffer> => {
		const $ = cheerio.load(contents.toString());

		(await Promise.all($("a").toArray().map(async (e) => {
			const href = $(e).attr("href");

			if (!href) {
				// Not violated if there is no href.
				return;
			}
			if (href.startsWith("#") || href.startsWith("/")) {
				// Not violated if the href starts with a hash or slash.
				return;
			}

			let parsed: url.URL;
			try {
				parsed = new url.URL(href);
			} catch (error) {
				console.warn(`Failed to parse URL ${href}.`);
				return;
			}
			if (parsed.hostname.endsWith(".onion")) {
				// Not violated if the hostname is already an onion service.
				return;
			}

			if (ignoreDomains.some((domain) => parsed.hostname.includes(domain))) {
				return;
			}

			if (parsed.protocol === "http:" || parsed.protocol === "https:") {
				let onionLocation;

				// Make request to the clearnet domain and see if it redirects to an onion service.
				const knownOnionLocation = options.knownOnionLocations[parsed.origin];
				if (knownOnionLocation) {
					const knownOnionLocationURL = new url.URL(knownOnionLocation);
					parsed.hostname = knownOnionLocationURL.hostname;
					parsed.protocol = knownOnionLocationURL.protocol;

					onionLocation = parsed.toString();
				} else {
					let response;
					try {
						response = await fetchCmd(href, {
							"method": "GET",
							"headers": {
								"User-Agent": userAgent
							}
						});
					} catch (error) {
						return {
							"message": `Failed to fetch ${href}.`
						};
					}

					onionLocation = response.headers.get("onion-location");
				}

				if (onionLocation) {
					$(e).attr("href", onionLocation);
				}
			}

			return;
		})));

		return Buffer.from($.html());
	}
};

export default rule;
