import path from 'node:path';
import { readJSON, writeFile } from './utils.js';

const BING = 'https://www.bing.com';

/**
 * 获取 Bing 每日壁纸信息（构建时请求，配合每日定时构建实现每天自动更换）
 *
 * 返回桌面横图和手机竖图两种尺寸，失败时回退到 data/bing.json 缓存。
 * @param {object} config 站点配置
 * @param {string} root 项目根目录
 * @param {{ offline?: boolean }} [opts] offline 为 true 时只读缓存
 * @returns {Promise<{ desktop: string, mobile: string, title: string, copyright: string, link: string, date: string }|null>}
 */
export async function loadBing(config, root, opts = {}) {
  const cacheFile = path.join(root, 'data', 'bing.json');
  const cache = await readJSON(cacheFile);
  const cfg = config.wallpaper || {};
  if (!cfg.bing) return null;
  if (opts.offline) return cache;
  try {
    const url = `${BING}/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=${encodeURIComponent(cfg.mkt || 'zh-CN')}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'homepager-build' }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const img = (await res.json()).images?.[0];
    if (!img?.urlbase) throw new Error('返回数据中没有图片');
    const data = {
      desktop: `${BING}${img.urlbase}_1920x1080.jpg`,
      mobile: `${BING}${img.urlbase}_1080x1920.jpg`,
      title: img.title || '',
      copyright: img.copyright || '',
      link: img.copyrightlink && /^https?:/.test(img.copyrightlink) ? img.copyrightlink : BING,
      date: img.enddate || img.startdate || '',
    };
    await writeFile(cacheFile, JSON.stringify(data, null, 2) + '\n');
    console.log(`  ✓ Bing 壁纸：${data.title || data.date}`);
    return data;
  } catch (err) {
    console.warn(`  ⚠ Bing 壁纸：${err.message}（使用缓存）`);
    return cache;
  }
}
