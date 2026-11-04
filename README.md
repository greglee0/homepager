# Homepager

铭记（Greglee）的个人主页。零依赖的 Node.js 静态站点生成器，推送后由 GitHub Actions 自动构建并部署到 GitHub Pages。

## 功能

- 整体为 Material Design 2 风格（应用栏、卡片阴影层级、水波纹、FAB、Snackbar）
- 首屏占满整屏：Bing 壁纸背景，抓取 12 个地区最近约 15 天的壁纸（去重后几十张），可上一张 / 下一张 / 随机切换，手机上可左右滑动，当天记住选择；手机竖屏用竖版图，每天定时构建自动更新、GitHub 头像、按时间段变化的问候语、身份打字机轮播、签名、社交按钮
- 此时此刻：实时时钟、一言（接口失败自动用本地句子，点击换一句）、今日 / 本周 / 本月 / 本年进度条
- 关于我：简介、标签、GitHub 统计（公开仓库、星标、关注者，数字滚动动画）、常用站点导航
- 项目：精选仓库卡片（构建时从 GitHub 拉取星标、语言、更新时间）+ 最近活跃仓库
- 音乐播放器：Meting API 歌单或自定义歌曲，支持歌词、列表循环 / 单曲循环 / 随机、播放列表、锁屏媒体控制，滚出视口时显示悬浮播放按钮
- 此刻在忙：当前正在做的事情
- 最新版本：构建时拉取 AIDE-Plus 最新 Release、更新要点、累计下载量、最近版本，并提供 APK 直链下载
- 最新文章：构建时读取博客 `atom.xml`（失败时尝试 `search.xml`，再失败用 `data/posts.json` 缓存）
- 仓库语言分布、常用工具、友情链接（头像加载失败显示首字）
- 页脚不蒜子访问量；彩蛋：控制台问候，输入 ↑↑↓↓←→←→BA 开启彩虹模式
- 技能条、GitHub 贡献日历（随深浅主题变色）、时间线、联系方式（QQ 等可一键复制）
- 浅色 / 深色 / 跟随系统 三态主题，无闪白
- 中英双语（`/` 中文，`/en/` 英文）
- 命令面板：按 `/` 或 `Ctrl+K` 打开；`T` 切换主题，`L` 切换语言
- 滚动淡入、导航高亮、回到顶部
- 手机 / 平板 / 电脑自适应，适配刘海屏安全区，尊重系统“减少动画”设置
- SEO：canonical、hreflang、Open Graph、sitemap.xml、robots.txt、PWA manifest、404 页面

## 修改内容

几乎所有内容都在 [`site.config.js`](./site.config.js) 里：个人资料、社交链接、常用站点、技能、精选项目、时间线、功能开关。
带 `{ zh, en }` 的字段是双语文本，只写字符串则两种语言共用。界面固定文字在 `src/i18n/` 中。

## 本地开发

需要 Node.js 18.17 及以上，无需安装任何依赖。

```bash
npm run dev            # 开发服务器 http://localhost:4000，修改后自动刷新
npm run dev:offline    # 不请求 GitHub，只用 data/github.json 缓存
npm run build          # 生成 dist/
npm run check          # 检查语言文件、脚本语法、页面内链接
```

可选环境变量：

| 变量 | 作用 |
| --- | --- |
| `GITHUB_TOKEN` | 提高 GitHub 接口限额，并启用贡献日历（GraphQL 需要 token） |
| `SITE_BASE` | 部署子路径，例如 `/homepager`；自定义域名时留空 |
| `SITE_URL` | 覆盖 `site.url` |

## 部署

1. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
2. 推送到 `dev`（或 `main` / `master`）分支即自动部署，每天也会定时重新构建一次以刷新 GitHub 数据。
3. 想用自定义域名（例如 `greglee.cn`）：在 `site.config.js` 填 `site.cname` 和 `site.url`，再到域名服务商添加 CNAME 记录指向 `greglee0.github.io`。
4. 可选：添加名为 `GH_PROFILE_TOKEN` 的仓库 Secret（只读的个人 token），贡献日历会更完整。

## 目录结构

```
site.config.js        站点配置（主要改这里）
scripts/build.js      构建脚本
scripts/dev.js        开发服务器（热刷新）
scripts/check.js      构建检查
scripts/lib/          GitHub / 博客 feed 数据拉取、工具函数
src/templates/        页面模板与图标
src/assets/           CSS 与前端脚本
src/i18n/             界面文字（中 / 英）
src/public/           原样复制的静态文件（favicon 等）
data/github.json      GitHub 数据缓存，接口失败时使用
data/posts.json       博客文章缓存
```
