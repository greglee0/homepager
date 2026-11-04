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
 * @param {string} opts.base 站点部署的子路径，例如 /homepager/
 * @param {object} opts.assets 带指纹的静态资源文件名
 * @returns {object} 渲染上下文
 */
export function createContext({ config, lang, dict, github, base, assets }) {
  const otherLang = lang === 'zh' ? 'en' : 'zh';
  /** 生成某个语言首页的相对地址 */
  const langHref = (l) => (l === config.site.defaultLang ? base : `${base}${l}/`);
  return {
    config,
    lang,
    dict,
    github,
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
  const links = ['about', 'projects', 'skills', 'timeline', 'contact']
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
 * 渲染首屏：头像、问候、名字、打字机、签名、按钮和社交图标
 * @param {object} ctx 渲染上下文
 * @returns {string} HTML
 */
function renderHero(ctx) {
  const { t, p, config, github } = ctx;
  const avatar = config.profile.avatar || github.user?.avatar_url || `https://github.com/${config.profile.github}.png`;
  const roles = p(config.profile.roles) || [];
  return `<section class="hero" id="top">
  <div class="hero-bg" aria-hidden="true"><span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span></div>
  <div class="container hero-inner">
    <div class="avatar-wrap reveal">
      <img class="avatar" src="${esc(avatar)}" alt="${esc(p(config.profile.name))}" width="160" height="160" fetchpriority="high">
      <span class="status-dot" title="online"></span>
    </div>
    <p class="hero-greet reveal" id="greet">${esc(t('hero.hello'))}</p>
    <h1 class="hero-name reveal">${esc(p(config.profile.name))}</h1>
    <p class="hero-role reveal"><span id="typing" data-roles="${esc(JSON.stringify(roles))}">${esc(roles[0] || '')}</span><span class="caret" aria-hidden="true"></span></p>
    <p class="hero-motto reveal">${esc(p(config.profile.motto))}</p>
    <div class="hero-cta reveal">
      <a class="btn btn-primary" href="#projects">${icon('folder')}${esc(t('hero.viewProjects'))}</a>
      <a class="btn btn-ghost" href="#contact">${icon('mail')}${esc(t('hero.contactMe'))}</a>
    </div>
    <div class="social reveal">${renderSocial(ctx)}</div>
  </div>
  <a class="scroll-hint" href="#dashboard" aria-label="${esc(t('hero.scroll'))}">${icon('chevron-down')}</a>
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
  if (!f.clock && !f.hitokoto && !f.timeProgress) return '';
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
    </div>
  </div>
</section>`;
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
  const u = github.user;
  const stats = typeof u?.public_repos === 'number'
    ? [
        ['repos', u.public_repos],
        ['stars', stars],
        ['followers', u.followers],
        ['following', u.following],
      ]
        .map(([k, v]) => `<div class="stat"><b data-count="${v}">${compact(v)}</b><span>${esc(t(`stats.${k}`))}</span></div>`)
        .join('')
    : '';
  return `<section class="section" id="about" aria-labelledby="about-title">
  <div class="container">
    ${sectionHead('about', t('sections.about'))}
    <div class="about-grid${stats ? '' : ' single'}">
      <div class="card about-text reveal">${paras}<ul class="facts">${facts}</ul></div>
      ${stats ? `<div class="card stats reveal">${stats}</div>` : ''}
    </div>
    ${renderSites(ctx)}
  </div>
</section>`;
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
    ...['about', 'projects', 'skills', 'timeline', 'contact'].map((k) => ({
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
    },
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
${renderProjects(ctx)}
${renderSkills(ctx)}
${renderTimeline(ctx)}
${renderContact(ctx)}
</main>
${renderFooter(ctx, buildTime)}
${renderPalette(ctx)}
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<button class="back-top" id="back-top" type="button" aria-label="${esc(ctx.t('backTop'))}">${icon('arrow-up')}</button>
${ctx.config.features.cursorGlow ? '<div class="cursor-glow" id="cursor-glow" aria-hidden="true"></div>' : ''}
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
  <div class="hero-bg" aria-hidden="true"><span class="blob b1"></span><span class="blob b2"></span></div>
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
</head>
<body${config.features.loader && !noindex ? ' class="is-loading"' : ''}>
${config.features.loader && !noindex ? '<div class="loader" id="loader" aria-hidden="true"><span></span><span></span><span></span></div>' : ''}
<noscript><style>.reveal{opacity:1!important;transform:none!important}.loader{display:none!important}</style><p class="noscript">${esc(t('noscript'))}</p></noscript>
${body}
</body>
</html>`;
}
