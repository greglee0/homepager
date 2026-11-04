/**
 * 站点配置文件
 *
 * 所有个人信息、链接、项目、功能开关都在这里修改，改完推送到 GitHub 即可自动重新部署。
 * 带 { zh, en } 的字段支持中英双语，只写字符串则两种语言共用同一段文字。
 */
export default {
  /** 站点基础信息 */
  site: {
    /** 正式访问地址（用于 sitemap、canonical、分享卡片），不要以 / 结尾 */
    url: 'https://greglee0.github.io/homepager',
    /** 自定义域名，填写后会生成 CNAME 文件；留空则使用 GitHub Pages 默认地址 */
    cname: '',
    title: { zh: '铭记的主页', en: "Greglee's Home" },
    description: {
      zh: '铭记（Greglee）的个人主页：Android 开发者，AIDE-Plus 维护者。',
      en: 'Personal homepage of Greglee, Android developer and maintainer of AIDE-Plus.',
    },
    keywords: 'Greglee,铭记,AIDE-Plus,Android,个人主页',
    /** 主题色，会用于浏览器地址栏和强调色 */
    themeColor: '#3f51b5',
    /** 建站日期，用于页脚“已运行 N 天”，留空则不显示 */
    since: '2025-08-03',
    /** 默认语言：zh 或 en，另一种语言会生成在 /en/ 目录下 */
    defaultLang: 'zh',
    /** ICP 备案号，留空不显示 */
    icp: '',
  },

  /** 个人资料 */
  profile: {
    name: { zh: '铭记', en: 'Greglee' },
    /** GitHub 用户名：用于抓取头像、仓库和贡献图 */
    github: 'greglee0',
    /** 头像地址，留空则使用 GitHub 头像 */
    avatar: '',
    /** 名字下方的打字机轮播文字 */
    roles: {
      zh: ['Android 开发者', 'AIDE-Plus 维护者', '开源爱好者', '偶尔写写博客'],
      en: ['Android Developer', 'AIDE-Plus Maintainer', 'Open Source Lover', 'Occasional Blogger'],
    },
    /** 签名 */
    motto: { zh: '生如不定流水，夕拾朝花难寻', en: 'Life flows on like water; yesterday’s blossoms are hard to find.' },
    /** 关于我（支持多段，每段一个字符串） */
    about: {
      zh: [
        '你好！我是铭记，一名喜欢折腾的 Android 开发者。',
        '目前主要在维护 AIDE-Plus —— 一款运行在手机上的 Android 集成开发环境，让大家随时随地都能写代码、编译、打包 APK。',
        '平时会在博客里记录踩过的坑、开发工具推荐和一些学习心得。',
      ],
      en: [
        "Hi! I'm Greglee, an Android developer who loves to tinker.",
        "I'm currently maintaining AIDE-Plus, an Android IDE that runs on your phone so you can write, build and package APKs anywhere.",
        'I also write on my blog about pitfalls I hit, handy dev tools and things I learn along the way.',
      ],
    },
    /** 资料卡上的小标签 */
    facts: [
      { icon: 'code', text: { zh: 'Android / Java / Kotlin', en: 'Android / Java / Kotlin' } },
      { icon: 'rocket', text: { zh: 'AIDE-Plus 主要开发者', en: 'Core developer of AIDE-Plus' } },
      { icon: 'pen', text: { zh: '博客：blog.greglee.cn', en: 'Blog: blog.greglee.cn' } },
    ],
  },

  /**
   * 社交 / 联系方式
   * type: link（默认，打开链接）| copy（点击复制 value 到剪贴板）
   * icon 可选值见 src/templates/icons.js
   */
  social: [
    { icon: 'github', label: 'GitHub', url: 'https://github.com/greglee0' },
    { icon: 'blog', label: { zh: '博客', en: 'Blog' }, url: 'https://blog.greglee.cn' },
    { icon: 'mail', label: 'Email', url: 'mailto:3115093767@qq.com' },
    { icon: 'qq', label: 'QQ', type: 'copy', value: '3115093767' },
  ],

  /** 常用站点（导航卡片） */
  sites: [
    {
      icon: 'blog',
      name: { zh: '个人博客', en: 'Blog' },
      desc: { zh: '技术分享与生活随笔', en: 'Tech notes & essays' },
      url: 'https://blog.greglee.cn',
    },
    {
      icon: 'rocket',
      name: 'AIDE-Plus',
      desc: { zh: '手机上的 Android IDE', en: 'Android IDE on your phone' },
      url: 'https://plus.androidide.cn',
    },
    {
      icon: 'download',
      name: { zh: 'AIDE-Plus 下载', en: 'AIDE-Plus Releases' },
      desc: { zh: '最新版本 APK', en: 'Latest APK builds' },
      url: 'https://github.com/AndroidIDE-CN/AIDE-Plus/releases',
    },
    {
      icon: 'github',
      name: 'GitHub',
      desc: { zh: '我的开源仓库', en: 'My repositories' },
      url: 'https://github.com/greglee0',
    },
  ],

  /** 正在做的事（“此刻在忙”卡片） */
  now: [
    {
      icon: 'code',
      text: { zh: 'AIDE-Plus 2.3.5：自研 Kotlin 补全与实时报错引擎', en: 'AIDE-Plus 2.3.5: in-house Kotlin completion & diagnostics' },
    },
    { icon: 'sparkles', text: { zh: '给 AIDE-Plus 接入 AI 助手', en: 'Bringing an AI assistant into AIDE-Plus' } },
    { icon: 'terminal', text: { zh: '内置终端与 Gradle 命令构建', en: 'Built-in terminal & Gradle command builds' } },
    { icon: 'pen', text: { zh: '重写博客和个人主页', en: 'Rebuilding my blog and homepage' } },
  ],

  /**
   * 发布版本展示：构建时拉取最新版本、更新要点和累计下载量
   * repo 填 owner/name；site 为项目官网（可选）
   */
  releases: [
    {
      repo: 'AndroidIDE-CN/AIDE-Plus',
      name: 'AIDE-Plus',
      desc: {
        zh: '在手机上写代码、编译、打包 APK 的 Android IDE。',
        en: 'An Android IDE to write, build and package APKs right on your phone.',
      },
      site: 'https://plus.androidide.cn',
    },
  ],

  /** 博客：构建时依次尝试 feeds，读取最新文章 */
  blog: {
    url: 'https://blog.greglee.cn',
    feeds: ['https://blog.greglee.cn/atom.xml', 'https://blog.greglee.cn/search.json', 'https://blog.greglee.cn/search.xml'],
    /** 展示文章数量 */
    count: 6,
  },

  /** 技能，level 为 0-100 的熟练度 */
  skills: [
    { name: 'Java', level: 90 },
    { name: 'Android', level: 88 },
    { name: 'Kotlin', level: 75 },
    { name: 'Gradle', level: 72 },
    { name: 'Git', level: 80 },
    { name: 'JavaScript / Node.js', level: 65 },
    { name: 'C / C++ (NDK)', level: 50 },
  ],

  /** 常用工具（按分组展示为标签） */
  tools: [
    { group: { zh: '开发', en: 'Develop' }, items: ['Android Studio', 'AIDE-Plus', 'IntelliJ IDEA', 'VS Code'] },
    { group: { zh: '构建', en: 'Build' }, items: ['Gradle', 'Android SDK', 'NDK / CMake', 'Kotlin Compiler'] },
    { group: { zh: '环境', en: 'Environment' }, items: ['Git', 'GitHub Actions', 'Termux', 'Node.js'] },
  ],

  /**
   * 精选项目：repo 填 owner/name，构建时会自动从 GitHub 拉取星标、语言、简介；
   * 也可以手动填写 desc 覆盖 GitHub 上的简介。
   */
  projects: [
    {
      repo: 'AndroidIDE-CN/AIDE-Plus',
      desc: {
        zh: '运行在 Android 上的集成开发环境，支持 Java/Kotlin 编译、APK 打包与签名。',
        en: 'An IDE that runs on Android, with Java/Kotlin builds, APK packaging and signing.',
      },
      url: 'https://plus.androidide.cn',
    },
    { repo: 'AndroidIDE-CN/plus.androidide.cn', desc: { zh: 'AIDE-Plus 官网与文档。', en: 'Website & docs for AIDE-Plus.' } },
    { repo: 'greglee0/blog', desc: { zh: '个人博客源码。', en: 'Source of my blog.' }, url: 'https://blog.greglee.cn' },
    { repo: 'greglee0/homepager', desc: { zh: '就是你正在看的这个主页。', en: 'The homepage you are looking at.' } },
  ],

  /** 时间线（倒序排列，最新的在前） */
  timeline: [
    {
      date: '2026-10',
      title: { zh: 'AIDE-Plus 新版设置页', en: 'New settings for AIDE-Plus' },
      desc: { zh: '重做设置首页与搜索体验，完善图标库和签名设置。', en: 'Reworked settings home & search, icon library and signing.' },
    },
    {
      date: '2026-01',
      title: { zh: '博客改版', en: 'Blog revamp' },
      desc: { zh: '基于 Hexo + Butterfly 重新搭建博客。', en: 'Rebuilt my blog with Hexo + Butterfly.' },
    },
    {
      date: '2025-08',
      title: { zh: 'AIDE-Plus 发布仓库上线', en: 'AIDE-Plus release repo' },
      desc: { zh: '开始在 GitHub 发布 AIDE-Plus 版本。', en: 'Started publishing AIDE-Plus builds on GitHub.' },
    },
  ],

  /**
   * 友情链接（与博客 source/_data/link.yml 同步），按分组展示
   * 每组：{ name, desc, links: [{ name, url, avatar, desc }] }；name、desc 可写成 { zh, en }
   */
  friends: [
    {
      name: { zh: '参考博客', en: 'Reference blogs' },
      desc: { zh: '欢迎互换友链', en: 'Link exchanges welcome' },
      links: [
        { name: '【茶】贰猹の小窝', url: 'https://noionion.top/', avatar: 'https://noionion-picture-bed.oss-cn-hangzhou.aliyuncs.com/img/head.jpg', desc: '用这生命中的每一秒，给自己一个不后悔的未来' },
        { name: 'AriasakaのBlog', url: 'https://blog.yaria.top/', avatar: 'https://img.0v0.my/2024/12/05/67517ba094506.png', desc: '' },
        { name: '墨七', url: 'https://mo7.cc/', avatar: 'https://file.mo7.cc/static/lxh_gif/lxh_71.gif', desc: '墨染七弦月，笔耕半亩田' },
      ],
    },
    {
      name: { zh: '群友的博客', en: 'Friends from the group' },
      desc: { zh: '一些大佬', en: 'Some awesome folks' },
      links: [
        { name: '沐雨酆臻', url: 'https://blg.myfz.fun', avatar: 'https://myfz.fun/blg/logo/logo.png', desc: '沐雨酆臻个人博客' },
      ],
    },
  ],

  /**
   * 首屏壁纸：bing 为 true 时使用 Bing 每日壁纸（每天定时构建自动更新）
   * 会抓取多个地区最近约 15 天的壁纸，去重后可以在首屏左右切换
   */
  wallpaper: {
    bing: true,
    /** 抓取的地区，靠前的优先（同一张图优先用它的标题）；留空使用默认的 12 个地区 */
    markets: ['zh-CN', 'en-US', 'ja-JP', 'en-GB', 'de-DE', 'fr-FR', 'en-IN', 'en-CA', 'en-AU', 'it-IT', 'es-ES', 'pt-BR'],
    /** 最多保留多少张 */
    max: 40,
  },

  /**
   * 音乐播放器
   * - songs 不为空时直接使用自定义歌曲：{ title, artist, url, cover, lrc }（lrc 可填歌词文本或地址）
   * - 否则通过 Meting API 读取歌单：server 可选 netease / tencent，type 可选 playlist / album / song
   * 默认是网易云热歌榜，换成自己的歌单 id 即可
   */
  music: {
    enable: true,
    /** Meting 接口，可填多个，前一个失败自动换下一个 */
    api: ['https://api.i-meto.com/meting/api', 'https://api.injahow.cn/meting/', 'https://meting.qjqq.cn/'],
    server: 'netease',
    type: 'playlist',
    id: '3778678',
    songs: [],
    /** 默认音量 0-1 */
    volume: 0.7,
  },

  /** 功能开关 */
  features: {
    /** 首屏加载动画 */
    loader: false,
    /** 一言（每日一句），接口失败时使用本地句子 */
    hitokoto: true,
    /** 时钟和日期 */
    clock: true,
    /** 时光进度条（今日 / 本周 / 本月 / 本年） */
    timeProgress: true,
    /** GitHub 贡献日历 */
    contributions: true,
    /** 最近活跃仓库（构建时从 GitHub 拉取） */
    recentRepos: true,
    /** 最近活跃仓库展示数量 */
    recentReposCount: 6,
    /** 仓库语言分布图 */
    languages: true,
    /** 不蒜子访问统计（页脚显示访问量） */
    busuanzi: true,
    /** 彩蛋：控制台问候 + 输入 ↑↑↓↓←→←→BA 触发彩虹模式 */
    easterEgg: true,
    /** 键盘快捷键（T 切换主题，L 切换语言，/ 打开命令面板） */
    shortcuts: true,
  },

  /** 一言接口失败时的本地备选句子 */
  quotes: [
    { text: '生如不定流水，夕拾朝花难寻。', from: '铭记' },
    { text: 'Talk is cheap. Show me the code.', from: 'Linus Torvalds' },
    { text: '路漫漫其修远兮，吾将上下而求索。', from: '屈原' },
    { text: 'Stay hungry, stay foolish.', from: 'Steve Jobs' },
  ],
};
