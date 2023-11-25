import { Rule } from "../Rule";

import preferOnionServicesHtmlAHref from "./prefer-onion-services-html-a-href";
import preferOnionServicesRobotsTxtSitemap from "./prefer-onion-services-robots-txt-sitemap";

export const allRules: Rule[] = [
	preferOnionServicesHtmlAHref,
	preferOnionServicesRobotsTxtSitemap
];
