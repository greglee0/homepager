import path from 'node:path';
import { readJSON, writeFile } from './utils.js';

const API = 'https://api.github.com';

/**
 * 请求 GitHub REST API，自动携带 GITHUB_TOKEN（如果有）以提高速率限制
 * @param {string} endpoint 以 / 开头的接口路径
 * @returns {Promise<*>} 解析后的 JSON
 */
async function gh(endpoint) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'homepager-build' };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(API + endpoint, { headers, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} @ ${endpoint}`);
  return res.json();
}

/**
 * 通过 GraphQL 获取最近一年的贡献日历（GraphQL 必须携带 token，没有 token 时直接跳过）
 * @param {string} login GitHub 用户名
 * @returns {Promise<{ total: number, weeks: Array<Array<{ date: string, count: number, level: number }>> }>}
 */
async function fetchContributions(login) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) throw new Error('未设置 GITHUB_TOKEN，跳过贡献日历');
  const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}`;
  const res = await fetch(`${API}/graphql`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'homepager-build' },
    body: JSON.stringify({ query, variables: { login } }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} @ /graphql`);
  const json = await res.json();
  const cal = json?.data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal) throw new Error(`GraphQL 无数据：${JSON.stringify(json.errors || json).slice(0, 120)}`);
  const levels = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
  return {
    total: cal.totalContributions,
    weeks: cal.weeks.map((w) =>
      w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, level: levels[d.contributionLevel] ?? 0 })),
    ),
  };
}

/**
 * 只保留页面需要的仓库字段，减小缓存体积
 * @param {object} r GitHub 仓库对象
 * @returns {object} 精简后的仓库信息
 */
function slimRepo(r) {
  return {
    full_name: r.full_name,
    name: r.name,
    description: r.description,
    html_url: r.html_url,
    homepage: r.homepage,
    language: r.language,
    stargazers_count: r.stargazers_count,
    forks_count: r.forks_count,
    fork: r.fork,
    archived: r.archived,
    pushed_at: r.pushed_at,
    topics: r.topics || [],
  };
}

/**
 * 拉取仓库的发布记录，整理出最新版本、更新日志要点、下载量统计
 * @param {string} repo owner/name
 * @returns {Promise<object>} 发布信息摘要
 */
async function fetchReleases(repo) {
  const list = (await gh(`/repos/${repo}/releases?per_page=100`)).filter((r) => !r.draft);
  if (!list.length) throw new Error(`${repo} 没有发布版本`);
  /** 统计单个版本所有附件的下载次数 */
  const downloadsOf = (r) => r.assets.reduce((sum, a) => sum + a.download_count, 0);
  const latest = list[0];
  const main = latest.assets.find((a) => a.name.endsWith('.apk')) || latest.assets[0];
  // 只取更新日志中的列表项作为要点，并去掉 Markdown 加粗等标记
  const notes = (latest.body || '')
    .split(/\r?\n/)
    .filter((line) => /^\s*[-*]\s+/.test(line))
    .map((line) => line.replace(/^\s*[-*]\s+/, '').replace(/\*\*|__|`/g, '').trim())
    .slice(0, 6);
  return {
    repo,
    html_url: `https://github.com/${repo}/releases`,
    total: list.length,
    totalDownloads: list.reduce((sum, r) => sum + downloadsOf(r), 0),
    latest: {
      tag: latest.tag_name,
      name: latest.name || latest.tag_name,
      url: latest.html_url,
      published_at: latest.published_at,
      prerelease: latest.prerelease,
      downloads: downloadsOf(latest),
      notes,
      asset: main ? { name: main.name, url: main.browser_download_url, size: main.size } : null,
    },
    recent: list.slice(0, 6).map((r) => ({
      tag: r.tag_name,
      url: r.html_url,
      published_at: r.published_at,
      downloads: downloadsOf(r),
      prerelease: r.prerelease,
    })),
  };
}

/**
 * 拉取 GitHub 数据（用户信息、个人仓库、精选项目），失败时回退到本地缓存
 *
 * 每一项独立请求、独立回退：某个接口失败不会影响其它数据，
 * 成功拿到的新数据会写回 data/github.json 作为下次构建的缓存。
 * @param {object} config 站点配置
 * @param {string} root 项目根目录
 * @param {{ offline?: boolean }} [opts] offline 为 true 时只读缓存
 * @returns {Promise<{ user: object|null, repos: object[], featured: Record<string, object>, contributions: object|null, releases: Record<string, object>, fetchedAt: string|null }>}
 */
export async function loadGithubData(config, root, opts = {}) {
  const cacheFile = path.join(root, 'data', 'github.json');
  const cache = (await readJSON(cacheFile)) || { user: null, repos: [], featured: {}, contributions: null, fetchedAt: null };
  cache.releases = cache.releases || {};
  if (opts.offline) return cache;

  const login = config.profile.github;
  const result = { ...cache, featured: { ...cache.featured }, releases: { ...(cache.releases || {}) } };
  let changed = false;

  const tasks = [
    gh(`/users/${login}`).then((u) => {
      result.user = {
        login: u.login,
        name: u.name,
        avatar_url: u.avatar_url,
        bio: u.bio,
        public_repos: u.public_repos,
        followers: u.followers,
        following: u.following,
        html_url: u.html_url,
        created_at: u.created_at,
      };
      changed = true;
    }),
    gh(`/users/${login}/repos?per_page=100&sort=pushed`).then((list) => {
      result.repos = list.map(slimRepo);
      changed = true;
    }),
    fetchContributions(login).then((c) => {
      result.contributions = c;
      changed = true;
    }),
    ...(config.releases || []).map((r) =>
      fetchReleases(r.repo).then((data) => {
        result.releases[r.repo] = data;
        changed = true;
      }),
    ),
    ...config.projects.map((p) =>
      gh(`/repos/${p.repo}`).then((r) => {
        result.featured[p.repo] = slimRepo(r);
        changed = true;
      }),
    ),
  ];

  const settled = await Promise.allSettled(tasks);
  const failed = settled.filter((s) => s.status === 'rejected');
  failed.forEach((f) => console.warn(`  ⚠ GitHub: ${f.reason.message}（使用缓存）`));

  if (changed) {
    result.fetchedAt = new Date().toISOString();
    await writeFile(cacheFile, JSON.stringify(result, null, 2) + '\n');
  }
  console.log(`  ✓ GitHub 数据：${settled.length - failed.length}/${settled.length} 个接口成功`);
  return result;
}
