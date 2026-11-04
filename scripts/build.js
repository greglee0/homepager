#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadGithubData } from './lib/github.js';
import { loadPosts } from './lib/feed.js';
import { copyDir, minifyCss, minifyHtml, pick, readJSON, writeFile } from './lib/utils.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'dist');

/**
 * 规范化部署子路径：保证以 / 开头并以 / 结尾
 * 例如 GitHub Pages 项目站点的 "/homepager" 会被转成 "/homepager/"
 * @param {string} [raw] 原始路径
 * @returns {string} 规范化后的路径
 */
function normalizeBase(raw) {
  if (!raw) return '/';
  const trimmed = raw.replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}/` : '/';
}

/**
 * 给静态资源加上内容哈希，方便浏览器长期缓存，内容变化时自动失效
 * @param {string} name 原文件名，例如 main.css
 * @param {string} content 文件内容
 * @returns {string} 带哈希的文件名，例如 main.3fa2c1d0.css
 */
function hashed(name, content) {
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 8);
  const ext = path.extname(name);
  return `${path.basename(name, ext)}.${hash}${ext}`;
}

/**
 * 校验配置，提前发现常见错误，避免生成出残缺页面
 * @param {object} config 站点配置
 */
function validateConfig(config) {
  const errors = [];
  if (!config.profile?.github) errors.push('profile.github 不能为空');
  if (!/^https?:\/\//.test(config.site?.url || '')) errors.push('site.url 必须以 http(s):// 开头');
  if (!['zh', 'en'].includes(config.site?.defaultLang)) errors.push('site.defaultLang 只能是 zh 或 en');
  (config.projects || []).forEach((p, i) => {
    if (!/^[\w.-]+\/[\w.-]+$/.test(p.repo || '')) errors.push(`projects[${i}].repo 格式应为 owner/name`);
  });
  (config.skills || []).forEach((s, i) => {
    if (typeof s.level !== 'number') errors.push(`skills[${i}].level 必须是数字`);
  });
  if (errors.length) {
    throw new Error(`配置有误：\n  - ${errors.join('\n  - ')}`);
  }
}

/**
 * 构建整个站点：读取配置 → 拉取 GitHub 数据 → 处理静态资源 → 渲染多语言页面 → 生成 SEO 文件
 * @param {object} [opts]
 * @param {boolean} [opts.offline] 只使用缓存的 GitHub 数据
 * @param {boolean} [opts.dev] 开发模式：不压缩，并注入热更新脚本
 * @param {string} [opts.base] 部署子路径，默认读取环境变量 SITE_BASE
 * @returns {Promise<{ outDir: string, ms: number }>}
 */
export async function build(opts = {}) {
  const started = Date.now();
  const base = normalizeBase(opts.base ?? process.env.SITE_BASE);
  // 每次构建都重新导入配置，开发模式下修改配置能立即生效
  const configUrl = `${pathToFileURL(path.join(ROOT, 'site.config.js')).href}?t=${started}`;
  const config = (await import(configUrl)).default;
  // CI 中可通过 SITE_URL 覆盖访问地址（GitHub Actions 会自动传入 Pages 地址）
  if (process.env.SITE_URL) config.site.url = process.env.SITE_URL.replace(/\/+$/, '');
  validateConfig(config);

  // 模板也带时间戳重新导入，保证开发模式修改模板后能热更新
  const { createContext, renderIndex, renderNotFound } = await import(
    `${pathToFileURL(path.join(SRC, 'templates', 'page.js')).href}?t=${started}`
  );

  const [github, posts] = await Promise.all([
    loadGithubData(config, ROOT, { offline: opts.offline }),
    loadPosts(config, ROOT, { offline: opts.offline }),
  ]);

  await fs.rm(OUT, { recursive: true, force: true });
  await copyDir(path.join(SRC, 'public'), OUT);

  // 处理 CSS / JS：生产模式压缩并加哈希
  let css = await fs.readFile(path.join(SRC, 'assets', 'css', 'main.css'), 'utf8');
  let js = await fs.readFile(path.join(SRC, 'assets', 'js', 'main.js'), 'utf8');
  if (!opts.dev) css = minifyCss(css);
  if (opts.dev) js += `\n;new EventSource('/__reload').onmessage=()=>location.reload();`;
  const assets = {
    css: `assets/${opts.dev ? 'main.css' : hashed('main.css', css)}`,
    js: `assets/${opts.dev ? 'main.js' : hashed('main.js', js)}`,
  };
  await writeFile(path.join(OUT, assets.css), css);
  await writeFile(path.join(OUT, assets.js), js);

  const buildTime = new Date().toISOString();
  const finalize = (html) => (opts.dev ? html : minifyHtml(html));
  const langs = ['zh', 'en'];
  for (const lang of langs) {
    const dict = await readJSON(path.join(SRC, 'i18n', `${lang}.json`));
    if (!dict) throw new Error(`缺少语言文件 src/i18n/${lang}.json`);
    const ctx = createContext({ config, lang, dict, github, posts, base, assets });
    const dir = lang === config.site.defaultLang ? OUT : path.join(OUT, lang);
    await writeFile(path.join(dir, 'index.html'), finalize(renderIndex(ctx, buildTime)));
    if (lang === config.site.defaultLang) {
      await writeFile(path.join(OUT, '404.html'), finalize(renderNotFound(ctx)));
    }
  }

  await writeSeoFiles(config, base, buildTime);
  if (config.site.cname) await writeFile(path.join(OUT, 'CNAME'), `${config.site.cname}\n`);
  await writeFile(path.join(OUT, '.nojekyll'), '');

  const ms = Date.now() - started;
  console.log(`  ✓ 构建完成：${path.relative(ROOT, OUT)}/（base=${base}，${ms}ms）`);
  return { outDir: OUT, ms };
}

/**
 * 生成 sitemap.xml、robots.txt 和 PWA manifest
 * @param {object} config 站点配置
 * @param {string} base 部署子路径
 * @param {string} buildTime 构建时间
 */
async function writeSeoFiles(config, base, buildTime) {
  const { url } = config.site;
  const other = config.site.defaultLang === 'zh' ? 'en' : 'zh';
  const pages = [`${url}/`, `${url}/${other}/`];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((loc) => `  <url><loc>${loc}</loc><lastmod>${buildTime.slice(0, 10)}</lastmod></url>`).join('\n')}
</urlset>
`;
  await writeFile(path.join(OUT, 'sitemap.xml'), sitemap);
  await writeFile(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${url}/sitemap.xml\n`);

  const lang = config.site.defaultLang;
  const manifest = {
    name: pick(config.site.title, lang),
    short_name: pick(config.profile.name, lang),
    description: pick(config.site.description, lang),
    start_url: base,
    scope: base,
    display: 'standalone',
    background_color: '#0b0d14',
    theme_color: config.site.themeColor,
    icons: [{ src: `${base}favicon.svg`, sizes: 'any', type: 'image/svg+xml' }],
  };
  await writeFile(path.join(OUT, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));
}

// 直接运行脚本时执行构建：node scripts/build.js [--offline]
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log('▶ 开始构建主页');
  build({ offline: process.argv.includes('--offline') }).catch((err) => {
    console.error(`✗ 构建失败：${err.message}`);
    process.exit(1);
  });
}
