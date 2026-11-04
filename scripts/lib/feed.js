import path from 'node:path';
import { readJSON, writeFile } from './utils.js';

/**
 * 解码 XML 实体并去掉 CDATA 包裹
 * @param {string} s 原始文本
 * @returns {string} 解码后的文本
 */
function decode(s = '') {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

/**
 * 取出标签内的文本
 * @param {string} block XML 片段
 * @param {string} tag 标签名
 * @returns {string} 标签内容，找不到时返回空字符串
 */
function tagText(block, tag) {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? decode(m[1]) : '';
}

/**
 * 把 HTML 转成纯文本摘要
 * @param {string} html HTML 内容
 * @param {number} max 最大字符数
 * @returns {string} 摘要
 */
function excerpt(html, max = 90) {
  const text = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/**
 * 解析 RSS、Atom 或 Hexo search.xml，统一成文章列表
 * @param {string} xml feed 内容
 * @param {string} feedUrl feed 地址，用于把相对链接补全
 * @returns {Array<{ title: string, url: string, date: string|null, summary: string }>}
 */
export function parseFeed(xml, feedUrl) {
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) || [];
  return blocks
    .map((b) => {
      const href = (b.match(/<link[^>]*href="([^"]+)"/i) || [])[1];
      const rawUrl = href || tagText(b, 'link') || tagText(b, 'url');
      const date = tagText(b, 'published') || tagText(b, 'pubDate') || tagText(b, 'updated') || tagText(b, 'date');
      const body = tagText(b, 'summary') || tagText(b, 'description') || tagText(b, 'content');
      const parsed = date ? new Date(date) : null;
      return {
        title: excerpt(tagText(b, 'title'), 80),
        url: rawUrl ? new URL(rawUrl, feedUrl).href : '',
        date: parsed && !isNaN(parsed) ? parsed.toISOString() : null,
        summary: excerpt(body),
      };
    })
    .filter((p) => p.title && p.url);
}

/**
 * 读取博客最新文章：依次尝试配置的 feed 地址，第一个成功的为准，全部失败时使用缓存
 * @param {object} config 站点配置
 * @param {string} root 项目根目录
 * @param {{ offline?: boolean }} [opts] offline 为 true 时只读缓存
 * @returns {Promise<{ posts: object[], source: string|null, fetchedAt: string|null }>}
 */
export async function loadPosts(config, root, opts = {}) {
  const cacheFile = path.join(root, 'data', 'posts.json');
  const cache = (await readJSON(cacheFile)) || { posts: [], source: null, fetchedAt: null };
  const feeds = config.blog?.feeds || [];
  if (opts.offline || !feeds.length) return cache;

  for (const url of feeds) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'homepager-build' }, signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      let posts = parseFeed(await res.text(), url);
      if (!posts.length) throw new Error('没有解析到文章');
      // 有日期就按日期倒序；search.xml 没有日期则保持原顺序
      if (posts.every((p) => p.date)) posts.sort((a, b) => b.date.localeCompare(a.date));
      posts = posts.slice(0, 20);
      const result = { posts, source: url, fetchedAt: new Date().toISOString() };
      await writeFile(cacheFile, JSON.stringify(result, null, 2) + '\n');
      console.log(`  ✓ 博客文章：${posts.length} 篇（${url}）`);
      return result;
    } catch (err) {
      console.warn(`  ⚠ 博客 feed：${url} ${err.message}`);
    }
  }
  console.warn('  ⚠ 博客 feed 全部失败，使用缓存');
  return cache;
}
