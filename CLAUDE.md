# CLAUDE.md

## 项目概况

零依赖的 Node.js 静态个人主页生成器，输出到 `dist/`，由 `.github/workflows/deploy.yml` 部署到 GitHub Pages。

## 约定

- 内容改 `site.config.js`；界面固定文字放 `src/i18n/zh.json` 与 `en.json`（两份键必须一致，`npm run check` 会校验），模板里不要写死文案。
- 模板是纯 JS 模板字符串（`src/templates/page.js`），所有插入的数据都要经过 `esc()` 转义。
- 前端脚本 `src/assets/js/main.js` 保持 ES5 风格、无依赖。
- 重要函数写中文 JSDoc 注释。
- 改完运行 `npm run check`，并在本地 `npm run dev` 看效果。
