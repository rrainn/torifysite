import { Rule, Violation } from "../Rule";

import * as cheerio from "cheerio";
import * as url from "url";
import userAgent from "../utils/user-agent";
import fetchCmd from "../utils/fetch";

const ignoreDomains = [
	"twitter.com"
]

const rule: Rule = {
	"id": "prefer-onion-services-a-href",
	"description": "Prefer onion services over clearnet domains on links.",
	"default": "warn",

	"runOn": [
		{
			"fileExtensions": ["html", "htm"]
		}
	],

	"check": async (path, contents): Promise<Violation[]> => {
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

			const parsed = new url.URL(href);
			if (parsed.hostname.endsWith(".onion")) {
				// Not violated if the hostname is already an onion service.
				return;
			}

			if (ignoreDomains.some((domain) => parsed.hostname.includes(domain))) {
				return
			}

			if (parsed.protocol === "http:" || parsed.protocol === "https:") {
				// Make request to the clearnet domain and see if it redirects to an onion service.
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
				const onionLocation = response.headers.get("onion-location");
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
	"fix": async (path, contents): Promise<Buffer> => {
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

			const parsed = new url.URL(href);
			if (parsed.hostname.endsWith(".onion")) {
				// Not violated if the hostname is already an onion service.
				return;
			}

			if (ignoreDomains.some((domain) => parsed.hostname.includes(domain))) {
				return
			}

			if (parsed.protocol === "http:" || parsed.protocol === "https:") {
				// Make request to the clearnet domain and see if it redirects to an onion service.
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
				const onionLocation = response.headers.get("onion-location");
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
