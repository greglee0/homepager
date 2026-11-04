#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build.js';
import { readJSON } from './lib/utils.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];

/**
 * 收集对象中所有叶子节点的点号路径，用于比较两份语言文件是否一致
 * @param {object} obj 语言字典
 * @param {string} [prefix] 当前路径前缀
 * @returns {string[]} 路径列表
 */
function keysOf(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v) ? keysOf(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

/**
 * 检查中英文语言文件的键是否完全一致
 */
async function checkI18n() {
  const zh = await readJSON(path.join(ROOT, 'src/i18n/zh.json'));
  const en = await readJSON(path.join(ROOT, 'src/i18n/en.json'));
  const a = new Set(keysOf(zh));
  const b = new Set(keysOf(en));
  [...a].filter((k) => !b.has(k)).forEach((k) => problems.push(`en.json 缺少键 ${k}`));
  [...b].filter((k) => !a.has(k)).forEach((k) => problems.push(`zh.json 缺少键 ${k}`));
}

/**
 * 用 node --check 检查前端脚本语法
 */
function checkJsSyntax() {
  try {
    execFileSync(process.execPath, ['--check', path.join(ROOT, 'src/assets/js/main.js')], { stdio: 'pipe' });
  } catch (err) {
    problems.push(`main.js 语法错误：${err.stderr?.toString().trim()}`);
  }
}

/**
 * 检查生成的 HTML 中引用的站内资源是否都存在
 * @param {string} outDir 构建输出目录
 * @param {string} base 部署子路径
 */
async function checkLinks(outDir, base) {
  const pages = ['index.html', 'en/index.html', '404.html'];
  for (const page of pages) {
    const html = await fs.readFile(path.join(outDir, page), 'utf8').catch(() => null);
    if (html == null) {
      problems.push(`缺少页面 ${page}`);
      continue;
    }
    if (!html.includes('<title>')) problems.push(`${page} 缺少 <title>`);
    const refs = [...html.matchAll(/(?:href|src)="([^"#]+)"/g)].map((m) => m[1]);
    for (const ref of refs) {
      if (!ref.startsWith(base) || ref.startsWith('//')) continue;
      let rel = ref.slice(base.length);
      if (rel === '' || rel.endsWith('/')) rel += 'index.html';
      try {
        await fs.access(path.join(outDir, rel));
      } catch {
        problems.push(`${page} 引用了不存在的文件 ${ref}`);
      }
    }
    const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) {
      if (!ids.has(id)) problems.push(`${page} 的锚点 #${id} 没有对应元素`);
    }
  }
}

/**
 * 完整检查：语言文件、脚本语法、离线构建、链接完整性
 */
async function main() {
  console.log('▶ 开始检查');
  await checkI18n();
  checkJsSyntax();
  const base = '/homepager/';
  const { outDir } = await build({ offline: true, base });
  await checkLinks(outDir, base);
  if (problems.length) {
    console.error(`✗ 发现 ${problems.length} 个问题：\n  - ${problems.join('\n  - ')}`);
    process.exit(1);
  }
  console.log('✓ 检查通过');
}

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
