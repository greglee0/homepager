import { esc, pick, translate } from '../../scripts/lib/utils.js';
import { icon } from './icons.js';

/** GitHub 语言对应的颜色（只列常用的，其它使用默认色） */
const LANG_COLORS = {
  Java: '#b07219',
  Kotlin: '#A97BFF',
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Vue: '#41b883',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Python: '#3572A5',
  C: '#555555',
  'C++': '#f34b7d',
  Shell: '#89e051',
  Go: '#00ADD8',
  Rust: '#dea584',
  Dart: '#00B4AB',
};

/**
 * 创建渲染上下文：把语言、字典、配置、GitHub 数据收拢在一起，供各个区块函数使用
 * @param {object} opts
 * @param {object} opts.config 站点配置
 * @param {string} opts.lang 当前语言
 * @param {object} opts.dict 当前语言字典
 * @param {object} opts.github GitHub 数据
 * @param {object} [opts.posts] 博客文章数据
 * @param {object|null} [opts.bing] Bing 每日壁纸数据
 * @param {string} opts.base 站点部署的子路径，例如 /homepager/
 * @param {object} opts.assets 带指纹的静态资源文件名
 * @returns {object} 渲染上下文
 */
export function createContext({ config, lang, dict, github, posts, bing, base, assets }) {
  const otherLang = lang === 'zh' ? 'en' : 'zh';
  /** 生成某个语言首页的相对地址 */
  const langHref = (l) => (l === config.site.defaultLang ? base : `${base}${l}/`);
  return {
    config,
    lang,
    dict,
    github,
    posts,
    bing,
    base,
    assets,
    otherLang,
    langHref,
    t: (key, vars) => translate(dict, key, vars),
    p: (value) => pick(value, lang),
  };
}

/**
 * 格式化数字：大于 1000 时显示为 1.2k
 * @param {number} n 数字
 * @returns {string} 格式化结果
 */
function compact(n) {
  if (typeof n !== 'number') return '-';
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);
}

/**
 * 渲染区块标题
 * @param {string} id 锚点 id
 * @param {string} title 标题文字
 * @param {string} [extra] 标题右侧附加内容
 * @returns {string} HTML
 */
function sectionHead(id, title, extra = '') {
  return `<div class="section-head reveal"><h2 id="${id}-title"><span class="hash">#</span>${esc(title)}</h2>${extra}</div>`;
}

/**
 * 渲染顶部导航栏
 * @param {object} ctx 渲染上下文
 * @returns {string} HTML
 */
function renderHeader(ctx) {
  const { t, p, config } = ctx;
  const links = navKeys(ctx)
    .map((k) => `<a href="#${k}" data-nav="${k}">${esc(t(`nav.${k}`))}</a>`)
    .join('');
  return `<header class="topbar" id="topbar">
  <div class="topbar-inner container">
    <a class="brand" href="#top" aria-label="${esc(t('nav.home'))}">
      <span class="brand-dot"></span>${esc(p(config.profile.name))}
    </a>
    <nav class="nav" id="nav" aria-label="${esc(t('menu'))}">${links}</nav>
    <div class="actions">
      <a class="icon-btn" href="${ctx.langHref(ctx.otherLang)}" hreflang="${ctx.otherLang}" title="${esc(t('switchLang'))}" aria-label="${esc(t('switchLang'))}" data-lang-switch>${icon('languages')}</a>
      <button class="icon-btn" type="button" id="theme-toggle" title="${esc(t('theme.toggle'))}" aria-label="${esc(t('theme.toggle'))}">
        ${icon('sun', 'i-light')}${icon('moon', 'i-dark')}${icon('monitor', 'i-auto')}
      </button>
      ${config.features.shortcuts ? `<button class="icon-btn hide-sm" type="button" id="palette-open" title="${esc(t('palette.hint'))}" aria-label="${esc(t('palette.hint'))}">${icon('command')}</button>` : ''}
      <button class="icon-btn show-sm" type="button" id="menu-toggle" aria-expanded="false" aria-controls="nav" aria-label="${esc(t('menu'))}">${icon('menu', 'i-open')}${icon('x', 'i-close')}</button>
    </div>
  </div>
</header>`;
}

/**
 * 渲染首屏：Bing 每日壁纸背景、头像、问候、名字、身份轮播、签名、按钮和社交图标
 * @param {object} ctx 渲染上下文
 * @returns {string} HTML
 */
function renderHero(ctx) {
  const { t, p, config, github, bing } = ctx;
  const avatar = config.profile.avatar || github.user?.avatar_url || `https://github.com/${config.profile.github}.png`;
  const roles = p(config.profile.roles) || [];
  // 手机竖屏使用竖版壁纸；默认显示列表第一张（今天的壁纸），前端脚本负责切换
  const first = bing?.images?.[0];
  const wallpaper = first
    ? `<picture class="hero-wallpaper" aria-hidden="true">
      <source id="wp-source" media="(max-width: 720px) and (orientation: portrait)" srcset="${esc(first.mobile)}">
      <img id="wp-img" src="${esc(first.desktop)}" alt="" fetchpriority="high" decoding="async">
    </picture><div class="hero-scrim" aria-hidden="true"></div>`
    : '';
  const many = (bing?.images?.length || 0) > 1;
  /** 生成壁纸切换按钮 */
  const wpBtn = (id, name, label) =>
    `<button type="button" class="icon-btn" id="${id}" title="${esc(label)}" aria-label="${esc(label)}">${icon(name)}</button>`;
  const credit = first
    ? `<div class="wallpaper-bar">
      ${many ? wpBtn('wp-prev', 'chevron-left', t('wallpaper.prev')) : ''}
      <a class="wallpaper-credit" id="wp-credit" href="${esc(first.link)}" target="_blank" rel="noopener" title="${esc(first.copyright)}">${icon('image')}<span id="wp-title">${esc(first.title || first.copyright)}</span>${many ? `<small id="wp-count">1/${bing.images.length}</small>` : ''}</a>
      ${many ? wpBtn('wp-next', 'chevron-right', t('wallpaper.next')) + wpBtn('wp-random', 'shuffle', t('wallpaper.random')) : ''}
    </div>`
    : '';
  return `<section class="hero${first ? ' has-wallpaper' : ''}" id="top">
  ${wallpaper}
  <div class="container hero-inner">
    <img class="avatar" src="${esc(avatar)}" alt="${esc(p(config.profile.name))}" width="112" height="112">
    <p class="hero-greet" id="greet">${esc(t('hero.hello'))}</p>
    <h1 class="hero-name">${esc(p(config.profile.name))}</h1>
    <p class="hero-role"><span id="typing" data-roles="${esc(JSON.stringify(roles))}">${esc(roles[0] || '')}</span><span class="caret" aria-hidden="true"></span></p>
    <p class="hero-motto">${esc(p(config.profile.motto))}</p>
    <div class="hero-cta">
      <a class="btn btn-primary" href="#projects">${icon('folder')}${esc(t('hero.viewProjects'))}</a>
      <a class="btn btn-ghost" href="#contact">${icon('mail')}${esc(t('hero.contactMe'))}</a>
    </div>
    <div class="social">${renderSocial(ctx)}</div>
  </div>
  <a class="scroll-hint icon-btn" href="#dashboard" aria-label="${esc(t('hero.scroll'))}">${icon('chevron-down')}</a>
  ${credit}
</section>`;
}

/**
 * 渲染社交图标按钮列表（复制类型会渲染成按钮）
 * @param {object} ctx 渲染上下文
 * @param {boolean} [withLabel] 是否显示文字
 * @returns {string} HTML
 */
function renderSocial(ctx, withLabel = false) {
  return ctx.config.social
    .map((s) => {
      const label = esc(ctx.p(s.label));
      const inner = `${icon(s.icon)}${withLabel ? `<span>${label}</span>` : ''}`;
      const cls = withLabel ? 'chip' : 'social-btn';
      if (s.type === 'copy') {
        return `<button type="button" class="${cls}" data-copy="${esc(s.value)}" title="${label}: ${esc(s.value)}" aria-label="${label}">${inner}</button>`;
      }
      const ext = /^https?:/.test(s.url) ? ' target="_blank" rel="noopener me"' : '';
      return `<a class="${cls}" href="${esc(s.url)}"${ext} title="${label}" aria-label="${label}">${inner}</a>`;
    })
    .join('');
}

/**
 * 渲染“此时此刻”面板：时钟、一言、时光进度条
 * @param {object} ctx 渲染上下文
 * @returns {string} HTML
 */
function renderDashboard(ctx) {
  const { t, config } = ctx;
  const f = config.features;
  if (!f.clock && !f.hitokoto && !f.timeProgress && !config.music?.enable) return '';
  const progress = ['today', 'week', 'month', 'year']
    .map(
      (k) => `<div class="progress-item" data-progress="${k}">
        <div class="progress-label"><span>${esc(t(`dashboard.${k}`))}</span><span class="progress-val">0%</span></div>
        <div class="progress-track"><div class="progress-bar"></div></div>
      </div>`,
    )
    .join('');
  return `<section class="section" id="dashboard" aria-labelledby="dashboard-title">
  <div class="container">
    ${sectionHead('dashboard', t('sections.dashboard'))}
    <div class="dash-grid">
      ${f.clock ? `<div class="card clock-card reveal"><div class="clock" id="clock">--:--:--</div><div class="date" id="date"></div></div>` : ''}
      ${f.hitokoto ? `<figure class="card quote-card reveal">${icon('quote', 'quote-mark')}<blockquote id="hitokoto">${esc(t('dashboard.loadingQuote'))}</blockquote><figcaption id="hitokoto-from"></figcaption></figure>` : ''}
      ${f.timeProgress ? `<div class="card progress-card reveal">${progress}</div>` : ''}
      ${renderMusic(ctx)}
    </div>
  </div>
</section>`;
}

/**
 * 渲染音乐播放器卡片，歌曲由前端脚本按配置加载
 * @param {object} ctx 渲染上下文
 * @returns {string} HTML，未启用时为空
 */
function renderMusic(ctx) {
  const { t, config } = ctx;
  if (!config.music?.enable) return '';
  /** 生成一个带提示的图标按钮 */
  const btn = (id, name, label, cls = 'icon-btn') =>
    `<button type="button" class="${cls}" id="${id}" title="${esc(label)}" aria-label="${esc(label)}">${icon(name)}</button>`;
  return `<div class="card music-card reveal" id="music" data-state="loading">
    <div class="music-main">
      <div class="music-cover">${icon('music')}<img id="music-cover" alt="" hidden></div>
      <div class="music-info">
        <b id="music-title">${esc(t('music.loading'))}</b>
        <span id="music-artist"></span>
        <span class="music-lrc" id="music-lrc"></span>
      </div>
    </div>
    <div class="music-progress">
      <span id="music-cur">0:00</span>
      <input type="range" id="music-seek" min="0" max="1000" value="0" aria-label="${esc(t('music.seek'))}">
      <span id="music-dur">0:00</span>
    </div>
    <div class="music-controls">
      ${btn('music-mode', 'repeat', t('music.mode.list'))}
      ${btn('music-prev', 'skip-back', t('music.prev'))}
      <button type="button" class="fab-mini" id="music-play" title="${esc(t('music.play'))}" aria-label="${esc(t('music.play'))}">${icon('play', 'i-play')}${icon('pause', 'i-pause')}</button>
      ${btn('music-next', 'skip-forward', t('music.next'))}
      ${btn('music-list-btn', 'list-music', t('music.list'))}
    </div>
    <ol class="music-list" id="music-list" hidden></ol>
    ${['repeat', 'repeat-1', 'shuffle'].map((n) => `<template id="music-icon-${n}">${icon(n)}</template>`).join('')}
  </div>`;
}

/**
 * 渲染“关于我”：简介段落、标签和 GitHub 统计
 * @param {object} ctx 渲染上下文
 * @returns {string} HTML
 */
function renderAbout(ctx) {
  const { t, p, config, github } = ctx;
  const paras = (p(config.profile.about) || []).map((s) => `<p>${esc(s)}</p>`).join('');
  const facts = config.profile.facts.map((f) => `<li>${icon(f.icon)}<span>${esc(p(f.text))}</span></li>`).join('');
  const stars = github.repos.filter((r) => !r.fork).reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const downloads = Object.values(github.releases || {}).reduce((sum, r) => sum + (r.totalDownloads || 0), 0);
  const u = github.user || {};
  // 只展示拿到了数据的统计项
  const stats = [
    ['repos', u.public_repos],
    ['followers', u.followers],
    ['stars', typeof u.public_repos === 'number' ? stars : null],
    ['downloads', downloads || null],
  ]
    .filter(([, v]) => typeof v === 'number')
    .map(([k, v]) => `<div class="stat"><b data-count="${v}">${compact(v)}</b><span>${esc(t(`stats.${k}`))}</span></div>`)
    .join('');
  const side = `${stats ? `<div class="card stats reveal">${stats}</div>` : ''}${renderNow(ctx)}`;
  return `<section class="section" id="about" aria-labelledby="about-title">
  <div class="container">
    ${sectionHead('about', t('sections.about'))}
    <div class="about-grid${side ? '' : ' single'}">
      <div class="card about-text reveal">${paras}<ul class="facts">${facts}</ul></div>
      ${side ? `<div class="about-side">${side}</div>` : ''}
    </div>
    ${renderSites(ctx)}
  </div>
</section>`;
}

/**
 * 渲染“此刻在忙”列表
 * @param {object} ctx 渲染上下文
 * @returns {string} HTML，没有配置时为空
 */
function renderNow(ctx) {
  const { t, p, config } = ctx;
  if (!config.now?.length) return '';
  const items = config.now.map((n) => `<li>${icon(n.icon)}<span>${esc(p(n.text))}</span></li>`).join('');
  return `<div class="card now reveal"><h3><span class="pulse" aria-hidden="true"></span>${esc(t('sections.now'))}</h3><ul>${items}</ul></div>`;
}

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {string|null} iso ISO 时间字符串
 * @returns {string} 日期，无效时为空字符串
 */
function day(iso) {
  return iso ? String(iso).slice(0, 10) : '';
}

/**
 * 把更新日志要点拆成“标题：内容”两部分，标题加粗显示
 * @param {string} note 单条要点
 * @returns {string} HTML
 */
function noteItem(note) {
  const m = note.match(/^(.{1,16}?)[：:]\s*(.+)$/);
  return m ? `<li><b>${esc(m[1])}</b><span>${esc(m[2])}</span></li>` : `<li><span>${esc(note)}</span></li>`;
}

/**
 * 渲染发布版本区块：最新版本、下载按钮、下载统计、更新要点、最近版本
 * @param {object} ctx 渲染上下文
 * @returns {string} HTML，没有数据时为空
 */
function renderReleases(ctx) {
  const { t, p, config, github } = ctx;
  const cards = (config.releases || [])
    .map((cfg) => {
      const r = github.releases?.[cfg.repo];
      if (!r) return '';
      const L = r.latest;
      const size = L.asset ? ` · ${(L.asset.size / 1048576).toFixed(1)} MB` : '';
      const history = r.recent
        .map(
          (v) => `<li><a href="${esc(v.url)}" target="_blank" rel="noopener"><code>${esc(v.tag)}</code><span>${day(v.published_at)}</span><span>${icon('download')}${compact(v.downloads)}</span></a></li>`,
        )
        .join('');
      return `<article class="card release reveal">
      <div class="release-main">
        <div class="release-title">
          <span class="site-icon">${icon('package')}</span>
          <div><h3>${esc(cfg.name || cfg.repo)}</h3><p class="muted">${esc(p(cfg.desc))}</p></div>
        </div>
        <div class="release-tag"><code>${esc(L.tag)}</code>${L.prerelease ? `<span class="badge">${esc(t('release.prerelease'))}</span>` : ''}<span class="muted">${icon('clock')}${day(L.published_at)}</span></div>
        <div class="release-stats">
          <div><b data-count="${r.totalDownloads}">${compact(r.totalDownloads)}</b><span>${esc(t('release.totalDownloads'))}</span></div>
          <div><b>${compact(L.downloads)}</b><span>${esc(t('release.latestDownloads'))}</span></div>
          <div><b>${r.total}</b><span>${esc(t('release.versions'))}</span></div>
        </div>
        <div class="release-actions">
          ${L.asset ? `<a class="btn btn-primary" href="${esc(L.asset.url)}" rel="noopener">${icon('download')}${esc(t('release.download'))}<small>${size}</small></a>` : ''}
          <a class="btn btn-ghost" href="${esc(r.html_url)}" target="_blank" rel="noopener">${icon('tag')}${esc(t('release.allReleases'))}</a>
          ${cfg.site ? `<a class="btn btn-ghost" href="${esc(cfg.site)}" target="_blank" rel="noopener">${icon('globe')}${esc(t('release.website'))}</a>` : ''}
        </div>
      </div>
      <div class="release-side">
        ${L.notes.length ? `<h4>${esc(t('release.highlights'))}</h4><ul class="notes">${L.notes.map(noteItem).join('')}</ul>` : ''}
        <h4>${esc(t('release.history'))}</h4><ul class="history">${history}</ul>
      </div>
    </article>`;
    })
    .join('');
  if (!cards) return '';
  return `<section class="section" id="release" aria-labelledby="release-title">
  <div class="container">
    ${sectionHead('release', t('sections.release'))}
    ${cards}
  </div>
</section>`;
}

/**
 * 渲染仓库语言分布：按非 fork 仓库的主要语言计数
 * @param {object} ctx 渲染上下文
 * @returns {string} HTML，没有数据时为空
 */
function renderLanguages(ctx) {
  const { t, github } = ctx;
  const counts = {};
  github.repos.filter((r) => !r.fork && r.language).forEach((r) => (counts[r.language] = (counts[r.language] || 0) + 1));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (!total) return '';
  const langs = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const color = (l) => LANG_COLORS[l] || 'var(--muted)';
  const bar = langs.map(([l, n]) => `<i style="width:${((n / total) * 100).toFixed(2)}%;background:${color(l)}" title="${esc(l)}"></i>`).join('');
  const legend = langs
    .map(([l, n]) => `<li><i class="lang-dot" style="background:${color(l)}"></i>${esc(l)}<span>${((n / total) * 100).toFixed(1)}%</span></li>`)
    .join('');
  return `<h3 class="sub-title reveal">${esc(t('sections.languages'))}</h3><div class="card langs reveal"><div class="lang-bar">${bar}</div><ul class="lang-legend">${legend}</ul></div>`;
}

/**
 * 渲染博客最新文章
 * @param {object} ctx 渲染上下文
 * @returns {string} HTML，没有配置博客时为空
 */
function renderPosts(ctx) {
  const { t, config, posts } = ctx;
  if (!config.blog) return '';
  const list = (posts?.posts || []).slice(0, config.blog.count || 6);
  const cards = list
    .map(
      (post) => `<a class="card post-card reveal" href="${esc(post.url)}" target="_blank" rel="noopener">
      ${post.date ? `<time datetime="${esc(post.date)}">${day(post.date)}</time>` : ''}
      <h3>${esc(post.title)}</h3>
      ${post.summary ? `<p>${esc(post.summary)}</p>` : ''}
    </a>`,
    )
    .join('');
  return `<section class="section" id="posts" aria-labelledby="posts-title">
  <div class="container">
    ${sectionHead('posts', t('sections.posts'), `<a class="more" href="${esc(config.blog.url)}" target="_blank" rel="noopener">${esc(t('posts.more'))} ${icon('external')}</a>`)}
    ${cards ? `<div class="post-grid">${cards}</div>` : `<p class="card muted reveal">${esc(t('posts.empty'))}</p>`}
  </div>
</section>`;
}

/**
 * 渲染常用工具标签
 * @param {object} ctx 渲染上下文
 * @returns {string} HTML，没有配置时为空
 */
function renderTools(ctx) {
  const { t, p, config } = ctx;
  if (!config.tools?.length) return '';
  const groups = config.tools
    .map((g) => `<div class="tool-group"><h4>${esc(p(g.group))}</h4><div class="tags">${g.items.map((i) => `<span class="tag">${esc(i)}</span>`).join('')}</div></div>`)
    .join('');
  return `<h3 class="sub-title reveal">${esc(t('sections.tools'))}</h3><div class="card tools reveal">${groups}</div>`;
}

/**
 * 渲染友情链接，头像加载失败时显示名字首字
 * @param {object} ctx 渲染上下文
 * @returns {string} HTML，没有友链时为空
 */
function renderFriends(ctx) {
  const { t, config } = ctx;
  if (!config.friends?.length) return '';
  const cards = config.friends
    .map(
      (f) => `<a class="card friend reveal" href="${esc(f.url)}" target="_blank" rel="noopener">
      <span class="friend-avatar" aria-hidden="true">${esc([...f.name.replace(/^[【\[(（].*?[】\])）]/, '')][0] || '?')}${f.avatar ? `<img src="${esc(f.avatar)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}</span>
      <span class="friend-body"><b>${esc(f.name)}</b><small>${esc(f.desc || new URL(f.url).host)}</small></span>
    </a>`,
    )
    .join('');
  return `<section class="section" id="friends" aria-labelledby="friends-title">
  <div class="container">
    ${sectionHead('friends', t('sections.friends'))}
    <div class="friend-grid">${cards}</div>
  </div>
</section>`;
}

/**
 * 计算导航中要显示的区块（没有内容的区块不显示）
 * @param {object} ctx 渲染上下文
 * @returns {string[]} 区块 id 列表
 */
function navKeys(ctx) {
  const { config } = ctx;
  return ['about', 'projects', 'posts', 'skills', 'timeline', 'friends', 'contact'].filter((k) => {
    if (k === 'posts') return !!config.blog;
    if (k === 'friends') return !!config.friends?.length;
    if (k === 'timeline') return !!config.timeline?.length;
    return true;
  });
}

/**
 * 渲染常用站点卡片
 * @param {object} ctx 渲染上下文
 * @returns {string} HTML
 */
function renderSites(ctx) {
  const { t, p, config } = ctx;
  if (!config.sites.length) return '';
  const cards = config.sites
    .map(
      (s) => `<a class="card site-card reveal" href="${esc(s.url)}" target="_blank" rel="noopener">
      <span class="site-icon">${icon(s.icon)}</span>
      <span class="site-body"><b>${esc(p(s.name))}</b><small>${esc(p(s.desc))}</small></span>
      ${icon('external', 'site-ext')}
    </a>`,
    )
    .join('');
  return `<h3 class="sub-title reveal">${esc(t('sections.sites'))}</h3><div class="site-grid">${cards}</div>`;
}

/**
 * 渲染单个仓库卡片
 * @param {object} ctx 渲染上下文
 * @param {object} repo 仓库数据（来自 GitHub 或配置）
 * @param {object} [override] 配置中的覆盖项（desc、url）
 * @returns {string} HTML
 */
function repoCard(ctx, repo, override = {}) {
  const { t, p } = ctx;
  const desc = p(override.desc) || repo.description || '';
  const lang = repo.language;
  const color = LANG_COLORS[lang] || 'var(--muted)';
  const updated = repo.pushed_at ? repo.pushed_at.slice(0, 10) : '';
  const visit = override.url || repo.homepage;
  return `<article class="card repo-card reveal" data-repo="${esc(repo.full_name)}">
    <header class="repo-head">${icon('folder')}<a href="${esc(repo.html_url)}" target="_blank" rel="noopener" class="repo-name">${esc(repo.full_name)}</a></header>
    <p class="repo-desc">${esc(desc)}</p>
    <footer class="repo-meta">
      ${lang ? `<span><i class="lang-dot" style="background:${color}"></i>${esc(lang)}</span>` : ''}
      <span title="Stars">${icon('star')}<b data-stars>${compact(repo.stargazers_count)}</b></span>
      <span title="Forks">${icon('fork')}${compact(repo.forks_count)}</span>
      ${updated ? `<span class="repo-updated" title="${esc(t('project.updated'))}">${icon('clock')}${updated}</span>` : ''}
      ${visit ? `<a class="repo-visit" href="${esc(visit)}" target="_blank" rel="noopener">${esc(t('project.visit'))}${icon('external')}</a>` : ''}
    </footer>
  </article>`;
}

/**
 * 渲染精选项目和最近活跃仓库
 * @param {object} ctx 渲染上下文
 * @returns {string} HTML
 */
function renderProjects(ctx) {
  const { t, config, github } = ctx;
  const featured = config.projects
    .map((proj) => {
      const data = github.featured[proj.repo] || {
        full_name: proj.repo,
        html_url: `https://github.com/${proj.repo}`,
        stargazers_count: null,
        forks_count: null,
      };
      return repoCard(ctx, data, proj);
    })
    .join('');
  const featuredNames = new Set(config.projects.map((p) => p.repo.toLowerCase()));
  const recent = config.features.recentRepos
    ? github.repos
        .filter((r) => !r.fork && !r.archived && !featuredNames.has(r.full_name.toLowerCase()))
        .slice(0, config.features.recentReposCount)
        .map((r) => repoCard(ctx, r))
        .join('')
    : '';
  return `<section class="section" id="projects" aria-labelledby="projects-title">
  <div class="container">
    ${sectionHead('projects', t('sections.projects'), `<a class="more" href="https://github.com/${esc(config.profile.github)}?tab=repositories" target="_blank" rel="noopener">GitHub ${icon('external')}</a>`)}
    <div class="repo-grid">${featured}</div>
    ${recent ? `<h3 class="sub-title reveal">${esc(t('sections.recent'))}</h3><div class="repo-grid">${recent}</div>` : ''}
    ${config.features.languages ? renderLanguages(ctx) : ''}
  </div>
</section>`;
}

/**
 * 渲染技能条和 GitHub 贡献日历
 * @param {object} ctx 渲染上下文
 * @returns {string} HTML
 */
function renderSkills(ctx) {
  const { t, config } = ctx;
  const bars = config.skills
    .map(
      (s) => `<li class="skill reveal">
      <div class="skill-label"><span>${esc(s.name)}</span><span>${s.level}%</span></div>
      <div class="skill-track"><div class="skill-bar" style="--w:${Math.max(0, Math.min(100, s.level))}%"></div></div>
    </li>`,
    )
    .join('');
  return `<section class="section" id="skills" aria-labelledby="skills-title">
  <div class="container">
    ${sectionHead('skills', t('sections.skills'))}
    <ul class="card skills">${bars}</ul>
    ${renderTools(ctx)}
    ${config.features.contributions ? renderContributions(ctx) : ''}
  </div>
</section>`;
}

/**
 * 渲染贡献日历：有 GraphQL 数据时生成可随主题变色的网格，否则回退到第三方图片
 * @param {object} ctx 渲染上下文
 * @returns {string} HTML
 */
function renderContributions(ctx) {
  const { t, config, github } = ctx;
  const data = github.contributions;
  let body;
  if (data?.weeks?.length) {
    const cols = data.weeks
      .map(
        (w) =>
          `<div class="cal-col">${w.map((d) => `<i class="l${d.level}" title="${d.date}: ${d.count}"></i>`).join('')}</div>`,
      )
      .join('');
    body = `<div class="cal-scroll"><div class="cal">${cols}</div></div><p class="cal-total">${data.total} contributions · ${esc(config.profile.github)}</p>`;
  } else {
    const color = config.site.themeColor.replace('#', '');
    body = `<div class="cal-scroll"><img class="cal-img" loading="lazy" src="https://ghchart.rshah.org/${color}/${esc(config.profile.github)}" alt="GitHub contributions"></div>`;
  }
  return `<h3 class="sub-title reveal">${esc(t('sections.contributions'))}</h3><div class="card contrib reveal">${body}</div>`;
}

/**
 * 渲染时间线
 * @param {object} ctx 渲染上下文
 * @returns {string} HTML
 */
function renderTimeline(ctx) {
  const { t, p, config } = ctx;
  if (!config.timeline.length) return '';
  const items = config.timeline
    .map(
      (it) => `<li class="tl-item reveal">
      <time class="tl-date">${esc(it.date)}</time>
      <div class="card tl-body"><h3>${esc(p(it.title))}</h3><p>${esc(p(it.desc))}</p></div>
    </li>`,
    )
    .join('');
  return `<section class="section" id="timeline" aria-labelledby="timeline-title">
  <div class="container">
    ${sectionHead('timeline', t('sections.timeline'))}
    <ol class="timeline">${items}</ol>
  </div>
</section>`;
}

/**
 * 渲染联系区块
 * @param {object} ctx 渲染上下文
 * @returns {string} HTML
 */
function renderContact(ctx) {
  const { t } = ctx;
  return `<section class="section" id="contact" aria-labelledby="contact-title">
  <div class="container">
    <div class="card contact reveal">
      <h2 id="contact-title">${esc(t('sections.contact'))}</h2>
      <p>${esc(t('contact.desc'))}</p>
      <div class="chips">${renderSocial(ctx, true)}</div>
    </div>
  </div>
</section>`;
}

/**
 * 渲染页脚
 * @param {object} ctx 渲染上下文
 * @param {string} buildTime 构建时间 ISO 字符串
 * @returns {string} HTML
 */
function renderFooter(ctx, buildTime) {
  const { t, p, config } = ctx;
  const year = new Date(buildTime).getFullYear();
  const since = config.site.since ? Number(config.site.since.slice(0, 4)) : year;
  const range = since < year ? `${since} - ${year}` : `${year}`;
  return `<footer class="footer">
  <div class="container footer-inner">
    <p>© ${range} ${esc(p(config.profile.name))} · <span id="running" data-since="${esc(config.site.since)}"></span></p>
    ${config.features.busuanzi ? `<p class="muted bsz"><span id="busuanzi_container_site_pv" style="display:none">${icon('eye')}${esc(t('footer.pv')).replace('{pv}', '<span id="busuanzi_value_site_pv"></span>')}</span><span id="busuanzi_container_site_uv" style="display:none">${icon('users')}${esc(t('footer.uv')).replace('{uv}', '<span id="busuanzi_value_site_uv"></span>')}</span></p>` : ''}
    <p class="muted">${esc(t('footer.builtWith'))} · ${esc(t('footer.lastBuild'))} <time datetime="${buildTime}">${buildTime.slice(0, 10)}</time></p>
    ${config.site.icp ? `<p class="muted"><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">${esc(config.site.icp)}</a></p>` : ''}
  </div>
</footer>`;
}

/**
 * 渲染命令面板（快捷键 / 打开），条目由前端脚本根据数据生成
 * @param {object} ctx 渲染上下文
 * @returns {string} HTML
 */
function renderPalette(ctx) {
  const { t } = ctx;
  return `<dialog class="palette" id="palette" aria-label="${esc(t('palette.hint'))}">
  <div class="palette-box">
    <input id="palette-input" type="text" autocomplete="off" spellcheck="false" placeholder="${esc(t('palette.placeholder'))}" aria-label="${esc(t('palette.placeholder'))}">
    <ul id="palette-list" role="listbox"></ul>
    <p class="palette-foot"><kbd>↑</kbd><kbd>↓</kbd> · <kbd>Enter</kbd> · <kbd>Esc</kbd></p>
  </div>
</dialog>`;
}

/**
 * 生成前端脚本需要的数据（i18n 文本、一言备选、功能开关、命令面板条目）
 * @param {object} ctx 渲染上下文
 * @returns {object} 前端数据
 */
function clientData(ctx) {
  const { t, p, config, dict } = ctx;
  const commands = [
    ...navKeys(ctx).map((k) => ({
      group: t('palette.goTo'),
      label: t(`nav.${k}`),
      href: `#${k}`,
    })),
    ...config.sites.map((s) => ({ group: t('palette.open'), label: p(s.name), href: s.url, external: true })),
    ...config.social
      .filter((s) => s.type !== 'copy')
      .map((s) => ({ group: t('palette.open'), label: p(s.label), href: s.url, external: /^https?:/.test(s.url) })),
    { group: t('palette.action'), label: t('theme.toggle'), action: 'theme' },
    { group: t('palette.action'), label: t('switchLang'), href: ctx.langHref(ctx.otherLang) },
  ];
  return {
    lang: ctx.lang,
    features: config.features,
    quotes: config.quotes,
    i18n: {
      week: dict.week,
      greet: dict.greet,
      hello: t('hero.hello'),
      copied: t('contact.copied'),
      copyFailed: t('contact.copyFailed'),
      running: t('footer.running'),
      passed: t('dashboard.passed'),
      empty: t('palette.empty'),
      theme: dict.theme,
      eggConsole: t('egg.console', { repo: `https://github.com/${config.profile.github}/homepager` }),
      eggRainbow: t('egg.rainbow'),
      music: dict.music,
      wallpaper: dict.wallpaper,
    },
    // 壁纸只传前端切换需要的字段
    wallpapers: (ctx.bing?.images || []).map((w) => ({
      id: w.id,
      desktop: w.desktop,
      mobile: w.mobile,
      title: w.title || w.copyright,
      copyright: w.copyright,
      link: w.link,
    })),
    music: config.music?.enable
      ? {
          api: config.music.api,
          server: config.music.server,
          type: config.music.type,
          id: config.music.id,
          songs: config.music.songs || [],
          volume: config.music.volume ?? 0.7,
        }
      : null,
    commands,
  };
}

/**
 * 渲染完整的首页 HTML
 * @param {object} ctx 渲染上下文
 * @param {string} buildTime 构建时间 ISO 字符串
 * @returns {string} 完整 HTML 文档
 */
export function renderIndex(ctx, buildTime) {
  const body = `${renderHeader(ctx)}
<main>
${renderHero(ctx)}
${renderDashboard(ctx)}
${renderAbout(ctx)}
${renderReleases(ctx)}
${renderProjects(ctx)}
${renderPosts(ctx)}
${renderSkills(ctx)}
${renderTimeline(ctx)}
${renderFriends(ctx)}
${renderContact(ctx)}
</main>
${renderFooter(ctx, buildTime)}
${renderPalette(ctx)}
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<button class="back-top" id="back-top" type="button" aria-label="${esc(ctx.t('backTop'))}">${icon('arrow-up')}</button>
${ctx.config.music?.enable ? `<button class="music-fab" id="music-fab" type="button" aria-label="${esc(ctx.t('music.title'))}" hidden>${icon('play', 'i-play')}${icon('pause', 'i-pause')}</button>` : ''}
<script>window.__SITE__=${JSON.stringify(clientData(ctx)).replace(/</g, '\\u003c')}</script>`;
  return layout(ctx, { body, path: ctx.lang === ctx.config.site.defaultLang ? '' : `${ctx.lang}/` });
}

/**
 * 渲染 404 页面
 * @param {object} ctx 渲染上下文
 * @returns {string} 完整 HTML 文档
 */
export function renderNotFound(ctx) {
  const { t } = ctx;
  const body = `<main class="notfound">
  <h1>404</h1>
  <p class="nf-title">${esc(t('notFound.title'))}</p>
  <p class="muted">${esc(t('notFound.desc'))}</p>
  <a class="btn btn-primary" href="${ctx.base}">${esc(t('notFound.back'))}</a>
</main>`;
  return layout(ctx, { body, path: '404.html', noindex: true, title: `404 · ${ctx.p(ctx.config.site.title)}` });
}

/**
 * 页面骨架：head（SEO、Open Graph、主题预加载脚本）+ body
 * @param {object} ctx 渲染上下文
 * @param {object} opts
 * @param {string} opts.body 页面主体 HTML
 * @param {string} opts.path 当前页面相对站点根的路径
 * @param {boolean} [opts.noindex] 是否禁止搜索引擎收录
 * @param {string} [opts.title] 自定义标题
 * @returns {string} 完整 HTML 文档
 */
function layout(ctx, { body, path, noindex = false, title }) {
  const { t, p, config, base, assets } = ctx;
  const site = config.site;
  const pageTitle = title || p(site.title);
  const desc = p(site.description);
  const url = `${site.url}/${path}`;
  const avatar = config.profile.avatar || ctx.github.user?.avatar_url || `https://github.com/${config.profile.github}.png`;
  const alt = ['zh', 'en']
    .map((l) => `<link rel="alternate" hreflang="${l === 'zh' ? 'zh-CN' : 'en'}" href="${site.url}${ctx.langHref(l).slice(base.length - 1)}">`)
    .join('');
  const bodyClass = [config.features.loader && !noindex ? 'is-loading' : '', ctx.bing?.images?.length && !noindex ? 'has-hero-image' : '']
    .filter(Boolean)
    .join(' ');
  // 主题预加载：在 CSS 生效前设置 data-theme，避免深色模式闪白
  const themeBoot = `(function(){try{var m=localStorage.getItem('theme')||'auto';var d=m==='dark'||(m==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.dataset.themeMode=m}catch(e){document.documentElement.dataset.theme='light'}})()`;
  return `<!doctype html>
<html lang="${esc(ctx.dict.htmlLang)}" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="keywords" content="${esc(site.keywords)}">
<meta name="author" content="${esc(p(config.profile.name))}">
<meta name="theme-color" content="${esc(site.themeColor)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(url)}">${alt}`}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(pageTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(avatar)}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="${base}favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${esc(avatar)}">
<link rel="manifest" href="${base}manifest.webmanifest">
<link rel="preconnect" href="https://avatars.githubusercontent.com" crossorigin>
<script>${themeBoot}</script>
<link rel="stylesheet" href="${base}${assets.css}">
<script src="${base}${assets.js}" defer></script>
${config.features.busuanzi && !noindex ? '<script async src="https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"></script>' : ''}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
${config.features.loader && !noindex ? '<div class="loader" id="loader" aria-hidden="true"><svg class="spinner" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle></svg></div>' : ''}
<noscript><style>.reveal{opacity:1!important;transform:none!important}.loader{display:none!important}</style><p class="noscript">${esc(t('noscript'))}</p></noscript>
${body}
</body>
</html>`;
}
