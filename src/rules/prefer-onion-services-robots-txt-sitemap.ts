import { Rule, Violation } from "../Rule";

import * as cheerio from "cheerio";
import * as url from "url";
import userAgent from "../utils/user-agent";
import fetchCmd from "../utils/fetch";

const rule: Rule = {
	"id": "prefer-onion-services-robots-txt-sitemap",
	"description": "Prefer onion services over clearnet domains on robots.txt sitemap.",
	"default": "warn",

	"runOn": [
		{
			"filePaths": ["/robots.txt"]
		}
	],

	"check": async (path, contents, options): Promise<Violation[]> => {
		const contentsString = contents.toString();
		const sitemap = contentsString.match(/^Sitemap: (.*)$/m);
		if (!sitemap) {
			return [];
		}

		const href = sitemap[1];
		const parsed = new url.URL(href);

		if (parsed.hostname.endsWith(".onion")) {
			// Not violated if the hostname is already an onion service.
			return [];
		}

		if (parsed.protocol === "http:" || parsed.protocol === "https:") {
			// Make request to the clearnet domain and see if it redirects to an onion service.
			const knownOnionLocation = options.knownOnionLocations[parsed.origin];
			if (knownOnionLocation) {
				const knownOnionLocationURL = new url.URL(knownOnionLocation);
				parsed.hostname = knownOnionLocationURL.hostname;
				parsed.protocol = knownOnionLocationURL.protocol;

				return [
					{
						"message": `Using clearnet domain ${href} instead of onion service ${parsed.toString()}.`
					}
				];
			} else {
				const response = await fetchCmd(href, {
					"method": "GET",
					"headers": {
						"User-Agent": userAgent
					}
				});
				const onionLocation = response.headers.get("onion-location");
				if (onionLocation) {
					return [
						{
							"message": `Using clearnet domain ${href} instead of onion service ${onionLocation}.`
						}
					];
				}
			}
		}

		return [];
	},
	"fix": async (path, contents, options): Promise<Buffer> => {
		const contentsString = contents.toString();
		const sitemap = contentsString.match(/^Sitemap: (.*)$/m);
		if (!sitemap) {
			return Buffer.from(contentsString);
		}

		const href = sitemap[1];
		const parsed = new url.URL(href);

		if (parsed.hostname.endsWith(".onion")) {
			// Not violated if the hostname is already an onion service.
			return Buffer.from(contentsString);
		}

		if (parsed.protocol === "http:" || parsed.protocol === "https:") {
			// Make request to the clearnet domain and see if it redirects to an onion service.
			const knownOnionLocation = options.knownOnionLocations[parsed.origin];
			if (knownOnionLocation) {
				const knownOnionLocationURL = new url.URL(knownOnionLocation);
				parsed.hostname = knownOnionLocationURL.hostname;
				parsed.protocol = knownOnionLocationURL.protocol;

				return Buffer.from(contentsString.replace(href, parsed.toString()));
			} else {
				const response = await fetchCmd(href, {
					"method": "GET",
					"headers": {
						"User-Agent": userAgent
					}
				});
				const onionLocation = response.headers.get("onion-location");
				if (onionLocation) {
					return Buffer.from(contentsString.replace(href, onionLocation));
				}
			}
		}

		return Buffer.from(contentsString);
	}
};

export default rule;
