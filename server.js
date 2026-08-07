import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const PORT = Number(process.env.PORT ?? 9000);
const ROOT = new URL(".", import.meta.url).pathname;

const MIME_TYPES = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".svg": "image/svg+xml",
	".ico": "image/x-icon",
	".png": "image/png"
};

Bun.serve({
	port: PORT,
	async fetch(req) {
		const url = new URL(req.url);
		let path = decodeURIComponent(url.pathname);
		if (path === "/") path = "/index.html";
		const filePath = normalize(join(ROOT, path));
		if (!filePath.startsWith(ROOT)) {
			return new Response("Forbidden", { status: 403 });
		}
		try {
			const body = await readFile(filePath);
			return new Response(body, {
				headers: {
					"Content-Type":
						MIME_TYPES[extname(filePath)] ?? "application/octet-stream"
				}
			});
		} catch {
			return new Response("Not Found", { status: 404 });
		}
	}
});

console.log(`Serving ${ROOT} at http://localhost:${PORT}`);
