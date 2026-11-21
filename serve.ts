// A tiny static file server for trying the app locally: `node serve.ts`, then open http://localhost:8080.
// Node 22 standard library only. It serves nothing outside app/ and is never part of the graded hand-in;
// the app itself needs no server at all — any static host, or the makefun.sh page, will do.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = fileURLToPath(new URL('./app/', import.meta.url));
const port = Number(process.env.PORT ?? 8080);

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const relative = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, '');
    const filePath = join(appDir, relative === '' ? 'index.html' : relative);
    if (!filePath.startsWith(appDir)) throw new Error('outside app/');
    const body = await readFile(filePath);
    response.writeHead(200, { 'content-type': MIME_TYPES[extname(filePath)] ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('not found');
  }
});

server.listen(port, () => {
  console.log(`Neon Coast Cover Studio at http://localhost:${port}`);
});
