#!/usr/bin/env node
import { createServer } from 'node:http';
import { promises as fs, watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 4000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

/** 已连接的热更新客户端（Server-Sent Events） */
const clients = new Set();

/**
 * 处理静态文件请求，目录自动补 index.html，找不到时返回 404 页面
 * @param {import('node:http').IncomingMessage} req 请求
 * @param {import('node:http').ServerResponse} res 响应
 */
async function serve(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/__reload') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(': connected\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }
  let file = path.join(OUT, decodeURIComponent(url.pathname));
  if (!file.startsWith(OUT)) {
    res.writeHead(403).end();
    return;
  }
  try {
    if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const body = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    const body = await fs.readFile(path.join(OUT, '404.html')).catch(() => 'Not Found');
    res.writeHead(404, { 'Content-Type': MIME['.html'] });
    res.end(body);
  }
}

/**
 * 重新构建并通知浏览器刷新；构建期间的重复触发会被合并
 */
let timer = null;
function scheduleRebuild() {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      await build({ offline: true, dev: true, base: '/' });
      clients.forEach((c) => c.write('data: reload\n\n'));
    } catch (err) {
      console.error(`✗ ${err.message}`);
    }
  }, 120);
}

/**
 * 启动开发服务器：首次构建（会尝试拉取 GitHub 数据），之后监听文件变化离线重建
 */
async function main() {
  await build({ dev: true, base: '/', offline: process.argv.includes('--offline') });
  for (const target of ['src', 'site.config.js']) {
    watch(path.join(ROOT, target), { recursive: true }, scheduleRebuild);
  }
  createServer(serve).listen(PORT, () => console.log(`▶ 开发服务器：http://localhost:${PORT}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
