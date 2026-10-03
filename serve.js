import http from 'node:http';
import fs from 'node:fs';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};
const contains = (root, file) => {
  const relative = path.relative(root, file);
  return relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
};

/** Local preview only. Missing paths remain 404s because this application has no client routes. */
export function createStaticServer(directory, { base = '/' } = {}) {
  const root = fs.realpathSync(directory);
  if (!base.startsWith('/') || !base.endsWith('/') || base.includes('..') || base.includes('\\')) throw new Error('Invalid base path.');
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-cache');
    const fail = (code, message) => { res.writeHead(code); res.end(message); };
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.setHeader('Allow', 'GET, HEAD'); fail(405, 'Method Not Allowed'); return;
    }
    let pathname;
    try { pathname = decodeURIComponent((req.url ?? '/').split('?')[0]); }
    catch { fail(400, 'Bad Request'); return; }
    if (!pathname.startsWith('/') || /[\\:\0]/.test(pathname) || pathname.split('/').some(part => part === '..' || part === '.')) {
      fail(403, 'Forbidden'); return;
    }
    if (!pathname.startsWith(base)) { fail(404, 'Not Found'); return; }
    const relative = pathname.slice(base.length) || 'index.html';
    const file = path.resolve(root, relative);
    if (!contains(root, file)) { fail(403, 'Forbidden'); return; }
    try {
      const actual = await realpath(file);
      if (!contains(root, actual)) { fail(403, 'Forbidden'); return; }
      const info = await stat(actual);
      if (!info.isFile()) { fail(404, 'Not Found'); return; }
      const content = req.method === 'HEAD' ? null : await readFile(actual);
      res.writeHead(200, {
        'Content-Type': mime[path.extname(actual).toLowerCase()] ?? 'application/octet-stream',
        'Content-Length': info.size,
        'Cache-Control': /^assets\/[\w.-]+-[\w-]{8,}\.[\w]+$/.test(relative)
          ? 'public, max-age=31536000, immutable' : 'no-cache',
      });
      res.end(content);
    } catch (error) {
      fail(['ENOENT', 'ENOTDIR'].includes(error.code) ? 404 : 500, error.code === 'ENOENT' ? 'Not Found' : 'Server Error');
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 5173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT.');
  const base = process.env.BASE_PATH ?? '/';
  createStaticServer(new URL('./dist', import.meta.url), { base }).listen(port, '127.0.0.1', () => {
    console.log('Local preview: http://127.0.0.1:' + port + base);
  });
}
