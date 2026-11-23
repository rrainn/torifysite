# torifysite

## Description

This is a simple CLI tool to make your onion service website more Tor friendly.

## Rules

| Rule | Description |
| --- | --- |
| prefer-onion-services-html-a-href | Prefer onion services in HTML a href |
| prefer-onion-services-robots-txt-sitemap | Prefer onion service in the sitemap of a robots.txt |

## Installation

```bash
npm install -g torifysite
```

## Usage

Print problems:

```bash
torifysite ./path/to/your/website
```

Fix problems:

```bash
torifysite ./path/to/your/website --fix
```

Use `--known-onion-locations <file>` to supply a JSON mapping of HTTPS or HTTP origins to onion origins. These mappings are applied locally.

Other eligible URLs are checked for an `Onion-Location` header. Each lookup has a 10-second budget, including a retry if time permits. In fix mode, failed lookups log the host and leave the original URL in place. In check mode, lookup failures are reported as violations.

## License

MIT License
