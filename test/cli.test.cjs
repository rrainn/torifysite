const assert = require("node:assert/strict");
const { execFile } = require("node:child_process");
const { once } = require("node:events");
const fs = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const { promisify } = require("node:util");

const run = promisify(execFile);
const cli = path.join(__dirname, "../dist/cli.js");

test("fix mode preserves stalled links and rewrites available onion locations", async (t) => {
	const directory = await fs.mkdtemp(path.join(os.tmpdir(), "torifysite-cli-"));
	t.after(() => fs.rm(directory, { recursive: true, force: true }));
	const requests = new Set();
	const server = http.createServer((request, response) => {
		requests.add(request.url);
		if (request.url === "/available") {
			// Leave the body open to exercise discovery from headers alone.
			response.writeHead(200, { "Onion-Location": "http://available.onion/page" });
			response.flushHeaders();
		}
		// The stalled endpoints never send response headers.
	});
	server.listen(0, "127.0.0.1");
	t.after(async () => {
		const closed = new Promise((resolve, reject) => {
			server.close((error) => error ? reject(error) : resolve());
		});
		server.closeAllConnections();
		await closed;
	});
	await once(server, "listening");

	const origin = `http://127.0.0.1:${server.address().port}`;
	const stalledLink = `${origin}/stalled-link`;
	const sitemap = `Sitemap: ${origin}/stalled-sitemap\n`;
	const html = [
		`<a href="${stalledLink}">Stalled</a>`,
		`<a href="${origin}/available">Available</a>`,
		'<a href="https://mapped.example/path">Mapped</a>'
	].join("\n");
	await Promise.all([
		fs.writeFile(path.join(directory, "index.html"), html),
		fs.writeFile(path.join(directory, "robots.txt"), sitemap),
		fs.writeFile(path.join(directory, "known.json"), JSON.stringify({
			"https://mapped.example": "http://mapped.onion"
		}))
	]);

	const { stderr } = await run(process.execPath, [cli, ".", "--fix", "--known-onion-locations", "known.json"], {
		cwd: directory,
		timeout: 15000
	});
	const rewritten = await fs.readFile(path.join(directory, "index.html"), "utf8");

	assert.deepEqual(requests, new Set(["/available", "/stalled-link", "/stalled-sitemap"]));
	assert.ok(rewritten.includes(`href="${stalledLink}"`));
	assert.ok(rewritten.includes('href="http://available.onion/page"'));
	assert.ok(rewritten.includes('href="http://mapped.onion/path"'));
	assert.equal(await fs.readFile(path.join(directory, "robots.txt"), "utf8"), sitemap);
	assert.equal(stderr.match(/timed out[^\n]*127\.0\.0\.1/gi)?.length, 2);
});
