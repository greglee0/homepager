import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * 转义 HTML 特殊字符，防止配置或接口数据中的内容破坏页面结构
 * @param {unknown} value 任意值
 * @returns {string} 转义后的字符串
 */
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 从双语字段中取出当前语言的值
 * @param {string|object|Array} value 字符串、{ zh, en } 对象或数组
 * @param {string} lang 语言代码
 * @returns {*} 当前语言对应的值，缺失时回退到中文
 */
export function pick(value, lang) {
  if (value && typeof value === 'object' && !Array.isArray(value) && ('zh' in value || 'en' in value)) {
    return value[lang] ?? value.zh ?? value.en;
  }
  return value;
}

/**
 * 按点号路径读取 i18n 文本，并替换 {name} 形式的占位符
 * @param {object} dict 语言字典
 * @param {string} key 例如 "footer.running"
 * @param {object} [vars] 占位符变量
 * @returns {string} 翻译后的文本，找不到时返回 key 本身
 */
export function translate(dict, key, vars = {}) {
  const raw = key.split('.').reduce((obj, k) => (obj == null ? obj : obj[k]), dict);
  if (typeof raw !== 'string') return key;
  return raw.replace(/\{(\w+)\}/g, (_, name) => (name in vars ? vars[name] : `{${name}}`));
}

/**
 * 读取 JSON 文件，文件不存在或解析失败时返回默认值
 * @param {string} file 文件路径
 * @param {*} fallback 默认值
 * @returns {Promise<*>} 解析结果
 */
export async function readJSON(file, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

/**
 * 写入文件，自动创建上级目录
 * @param {string} file 文件路径
 * @param {string|Buffer} content 文件内容
 */
export async function writeFile(file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
}

/**
 * 递归复制目录
 * @param {string} src 源目录
 * @param {string} dest 目标目录
 */
export async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  for (const entry of await fs.readdir(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) await copyDir(from, to);
    else await fs.copyFile(from, to);
  }
}

/**
 * 简单压缩 CSS：去掉注释和多余空白，无需额外依赖
 * @param {string} css 原始 CSS
 * @returns {string} 压缩后的 CSS
 */
export function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>~])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

/**
 * 压缩 HTML：去掉标签之间的空白，保留 pre/textarea/script 内容不变
 * @param {string} html 原始 HTML
 * @returns {string} 压缩后的 HTML
 */
export function minifyHtml(html) {
  const keep = [];
  const masked = html.replace(/<(pre|textarea|script)[\s\S]*?<\/\1>/gi, (m) => {
    keep.push(m);
    return `\u0000${keep.length - 1}\u0000`;
  });
  return masked
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .replace(/\u0000(\d+)\u0000/g, (_, i) => keep[Number(i)])
    .trim();
}
