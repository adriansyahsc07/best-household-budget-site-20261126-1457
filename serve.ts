// Local preview server for HematRumah (Node 22, standard library only).
//
//   node serve.ts            -> serves app/ at http://localhost:8080
//   node serve.ts --port 9000
//
// It maps the request path onto a file inside app/, answers 404 for anything
// missing and 403 for anything that would escape the folder. It exists only
// so the site can be opened and screenshotted on a developer machine; the
// handed-in site needs no server beyond any static file host.

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(fileURLToPath(new URL('./app/', import.meta.url)));

const argv = process.argv.slice(2);
const flagAt = argv.indexOf('--port');
const parsed = flagAt >= 0 ? Number(argv[flagAt + 1]) : 8080;
const port = Number.isInteger(parsed) && parsed > 0 && parsed < 65536 ? parsed : 8080;

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const server = createServer((req, res) => {
  let rawPath = (req.url ?? '/').split('?')[0].split('#')[0];
  try {
    rawPath = decodeURIComponent(rawPath);
  } catch {
    res.writeHead(400, { 'content-type': 'text/plain' }).end('bad request');
    return;
  }
  if (rawPath === '/' || rawPath.endsWith('/')) rawPath += 'index.html';

  const target = resolve(appDir, '.' + rawPath);
  if (target !== appDir && !target.startsWith(appDir + sep)) {
    res.writeHead(403, { 'content-type': 'text/plain' }).end('forbidden');
    return;
  }
  if (!existsSync(target) || !statSync(target).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
    return;
  }
  const type = CONTENT_TYPES[extname(target).toLowerCase()] ?? 'application/octet-stream';
  res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
  createReadStream(target).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`HematRumah preview: http://localhost:${port}`);
});
