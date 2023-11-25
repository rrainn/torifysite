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

## License

MIT License
