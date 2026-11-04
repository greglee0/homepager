import path from 'node:path';
import { readJSON, writeFile } from './utils.js';

const BING = 'https://www.bing.com';

/** 默认抓取的 Bing 地区：不同地区每天的壁纸不一样，合起来每天能有好几张 */
const DEFAULT_MARKETS = ['zh-CN', 'en-US', 'ja-JP', 'en-GB', 'de-DE', 'fr-FR', 'en-IN', 'en-CA', 'en-AU', 'it-IT', 'es-ES', 'pt-BR'];

/**
 * 从 urlbase 中取出图片的唯一名称，用来给不同地区的同一张图去重
 * 例如 "/th?id=OHR.FallLeaves_ZH-CN1234567" → "OHR.FallLeaves"
 * @param {string} urlbase Bing 返回的 urlbase
 * @returns {string} 图片名称
 */
function imageKey(urlbase) {
  const id = (urlbase.match(/id=([^&]+)/) || [])[1] || urlbase;
  return id.replace(/_[A-Z]{2}-[A-Z]{2}\d*$/i, '');
}

/**
 * 请求某个地区从第 idx 天开始的 n 张壁纸
 * @param {string} mkt 地区
 * @param {number} idx 从几天前开始（0 为今天）
 * @param {number} n 数量，Bing 最多返回 8 张
 * @returns {Promise<object[]>} 原始图片列表
 */
async function fetchArchive(mkt, idx, n) {
  const url = `${BING}/HPImageArchive.aspx?format=js&idx=${idx}&n=${n}&mkt=${encodeURIComponent(mkt)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'homepager-build' }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} (${mkt})`);
  return (await res.json()).images || [];
}

/**
 * 获取 Bing 壁纸列表（多个地区 × 最近约 15 天，去重后按日期倒序）
 *
 * 构建时请求，配合每日定时构建实现每天自动更新；失败时回退到 data/bing.json 缓存。
 * 列表第一张是今天默认地区（通常是 zh-CN）的壁纸。
 * @param {object} config 站点配置
 * @param {string} root 项目根目录
 * @param {{ offline?: boolean }} [opts] offline 为 true 时只读缓存
 * @returns {Promise<{ images: Array<{ id: string, desktop: string, mobile: string, thumb: string, title: string, copyright: string, link: string, date: string }> }|null>}
 */
export async function loadBing(config, root, opts = {}) {
  const cfg = config.wallpaper || {};
  if (!cfg.bing) return null;
  const cacheFile = path.join(root, 'data', 'bing.json');
  const cached = await readJSON(cacheFile);
  // 兼容旧版只有一张图的缓存格式
  const cache = cached && !cached.images && cached.desktop ? { images: [{ id: cached.desktop, thumb: cached.desktop, ...cached }] } : cached;
  if (opts.offline) return cache;

  const markets = cfg.markets?.length ? cfg.markets : DEFAULT_MARKETS;
  const tasks = markets.flatMap((mkt) => [fetchArchive(mkt, 0, 8), fetchArchive(mkt, 7, 8)]);
  const settled = await Promise.allSettled(tasks);
  const seen = new Map();
  settled.forEach((s, i) => {
    if (s.status !== 'fulfilled') return;
    const mkt = markets[Math.floor(i / 2)];
    for (const img of s.value) {
      if (!img?.urlbase) continue;
      const key = imageKey(img.urlbase);
      // 同一张图只保留第一个地区（配置靠前的地区优先，中文标题优先）
      if (seen.has(key)) continue;
      seen.set(key, {
        id: key,
        desktop: `${BING}${img.urlbase}_1920x1080.jpg`,
        mobile: `${BING}${img.urlbase}_1080x1920.jpg`,
        thumb: `${BING}${img.urlbase}_400x240.jpg`,
        title: img.title || '',
        copyright: img.copyright || '',
        link: img.copyrightlink && /^https?:/.test(img.copyrightlink) ? img.copyrightlink : BING,
        date: img.enddate || img.startdate || '',
        mkt,
      });
    }
  });

  if (!seen.size) {
    const reason = settled.find((s) => s.status === 'rejected')?.reason?.message || '没有图片';
    console.warn(`  ⚠ Bing 壁纸：${reason}（使用缓存）`);
    return cache;
  }
  // 按日期倒序；同一天保持地区顺序，保证第一张是今天的默认地区壁纸
  const images = [...seen.values()]
    .map((img, order) => ({ img, order }))
    .sort((a, b) => b.img.date.localeCompare(a.img.date) || a.order - b.order)
    .map(({ img }) => img)
    .slice(0, cfg.max || 40);
  const data = { images, fetchedAt: new Date().toISOString() };
  await writeFile(cacheFile, JSON.stringify(data, null, 2) + '\n');
  const failed = settled.filter((s) => s.status === 'rejected').length;
  console.log(`  ✓ Bing 壁纸：${images.length} 张（${tasks.length - failed}/${tasks.length} 个请求成功）`);
  return data;
}
