/* 主页前端交互脚本：无依赖，所有功能都按配置开关按需启用 */
(function () {
  'use strict';

  var SITE = window.__SITE__ || { features: {}, i18n: {}, quotes: [], commands: [] };
  var I = SITE.i18n;
  var F = SITE.features;
  var $ = function (sel, root) {
    return (root || document).querySelector(sel);
  };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * 安全读取 localStorage（隐私模式下可能抛错）
   * @param {string} key 键
   * @returns {string|null} 值
   */
  function load(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  /**
   * 安全写入 localStorage
   * @param {string} key 键
   * @param {string} value 值
   */
  function save(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* 忽略 */
    }
  }

  /**
   * 显示底部提示条
   * @param {string} text 提示文字
   */
  var toastTimer;
  function toast(text) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove('show');
    }, 2200);
  }

  /**
   * 复制文字到剪贴板，优先使用 Clipboard API，不支持时回退到 execCommand
   * @param {string} text 要复制的文字
   */
  function copy(text) {
    var done = function () {
      toast(I.copied + '：' + text);
    };
    var fallback = function () {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy') ? done() : toast(I.copyFailed);
      } catch (e) {
        toast(I.copyFailed);
      }
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  }

  /* ---------------------------------------------------------------------
     主题：light / dark / auto 三态循环，auto 跟随系统并实时响应系统切换
     --------------------------------------------------------------------- */
  var THEME_ORDER = ['auto', 'light', 'dark'];
  var media = window.matchMedia('(prefers-color-scheme: dark)');

  /**
   * 应用主题模式
   * @param {string} mode auto | light | dark
   */
  function applyTheme(mode) {
    var dark = mode === 'dark' || (mode === 'auto' && media.matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.documentElement.dataset.themeMode = mode;
    var btn = $('#theme-toggle');
    if (btn && I.theme) btn.title = I.theme.toggle + '（' + I.theme[mode] + '）';
  }

  /** 切换到下一个主题模式并提示 */
  function cycleTheme() {
    var cur = load('theme') || 'auto';
    var next = THEME_ORDER[(THEME_ORDER.indexOf(cur) + 1) % THEME_ORDER.length];
    save('theme', next);
    applyTheme(next);
    if (I.theme) toast(I.theme.toggle + '：' + I.theme[next]);
  }

  applyTheme(load('theme') || 'auto');
  var onSystemTheme = function () {
    if ((load('theme') || 'auto') === 'auto') applyTheme('auto');
  };
  if (media.addEventListener) media.addEventListener('change', onSystemTheme);
  else if (media.addListener) media.addListener(onSystemTheme);

  /* ---------------------------------------------------------------------
     时间相关：问候语、时钟、时光进度条、运行天数
     --------------------------------------------------------------------- */

  /**
   * 根据当前小时返回问候语
   * @param {number} h 小时 0-23
   * @returns {string} 问候语
   */
  function greeting(h) {
    var g = I.greet || {};
    if (h < 5) return g.night;
    if (h < 11) return g.morning;
    if (h < 13) return g.noon;
    if (h < 18) return g.afternoon;
    if (h < 23) return g.evening;
    return g.night;
  }

  /** 两位数补零 */
  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  /**
   * 计算今日 / 本周 / 本月 / 本年已过去的百分比
   * @param {Date} now 当前时间
   * @returns {{today:number, week:number, month:number, year:number}} 百分比
   */
  function progressOf(now) {
    var y = now.getFullYear();
    var m = now.getMonth();
    var dayStart = new Date(y, m, now.getDate());
    var today = (now - dayStart) / 864e5;
    // 周一作为一周开始
    var weekday = (now.getDay() + 6) % 7;
    var week = (weekday + today) / 7;
    var monthDays = new Date(y, m + 1, 0).getDate();
    var month = (now.getDate() - 1 + today) / monthDays;
    var yearStart = new Date(y, 0, 1);
    var yearEnd = new Date(y + 1, 0, 1);
    var year = (now - yearStart) / (yearEnd - yearStart);
    return { today: today * 100, week: week * 100, month: month * 100, year: year * 100 };
  }

  var clockEl = $('#clock');
  var dateEl = $('#date');
  var progressEls = $$('[data-progress]');
  var runningEl = $('#running');

  /** 每秒刷新一次的时间相关 UI */
  function tick() {
    var now = new Date();
    if (clockEl) clockEl.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    if (dateEl) {
      var d = SITE.lang === 'zh'
        ? now.getFullYear() + ' 年 ' + (now.getMonth() + 1) + ' 月 ' + now.getDate() + ' 日'
        : now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      dateEl.textContent = d + ' · ' + (I.week ? I.week[now.getDay()] : '');
    }
    if (progressEls.length) {
      var p = progressOf(now);
      progressEls.forEach(function (el) {
        var v = p[el.getAttribute('data-progress')];
        $('.progress-bar', el).style.width = v.toFixed(2) + '%';
        $('.progress-val', el).textContent = v.toFixed(1) + '%';
      });
    }
  }

  /** 页脚“已运行 N 天” */
  function renderRunning() {
    if (!runningEl) return;
    var since = runningEl.getAttribute('data-since');
    if (!since) return;
    var start = new Date(since + 'T00:00:00');
    var days = Math.max(0, Math.floor((Date.now() - start) / 864e5));
    if (!isNaN(days)) runningEl.textContent = I.running.replace('{days}', days);
  }

  var greetEl = $('#greet');
  if (greetEl) greetEl.textContent = greeting(new Date().getHours()) + (SITE.lang === 'zh' ? '，' : '! ') + I.hello;
  if (clockEl || progressEls.length) {
    tick();
    setInterval(tick, 1000);
  }
  renderRunning();

  /* ---------------------------------------------------------------------
     打字机效果：循环展示 roles
     --------------------------------------------------------------------- */
  (function typing() {
    var el = $('#typing');
    if (!el) return;
    var roles;
    try {
      roles = JSON.parse(el.getAttribute('data-roles') || '[]');
    } catch (e) {
      roles = [];
    }
    if (roles.length < 2 || reduceMotion) return;
    var i = 0;
    var len = roles[0].length;
    var deleting = true;
    /** 每一帧增删一个字符 */
    function step() {
      var word = roles[i];
      if (deleting) {
        len--;
        if (len <= 0) {
          deleting = false;
          i = (i + 1) % roles.length;
        }
      } else {
        len++;
        if (len >= roles[i].length) {
          deleting = true;
          el.textContent = roles[i];
          return setTimeout(step, 1800);
        }
      }
      word = roles[i];
      el.textContent = word.slice(0, Math.max(0, len));
      setTimeout(step, deleting ? 45 : 110);
    }
    setTimeout(step, 2200);
  })();

  /* ---------------------------------------------------------------------
     一言：调用 hitokoto 接口，失败时使用本地句子；点击可换一句
     --------------------------------------------------------------------- */
  var quoteEl = $('#hitokoto');
  var fromEl = $('#hitokoto-from');

  /**
   * 显示一句话（带淡入淡出）
   * @param {string} text 句子
   * @param {string} from 出处
   */
  function showQuote(text, from) {
    quoteEl.classList.add('fade');
    setTimeout(function () {
      quoteEl.textContent = text;
      fromEl.textContent = from ? '—— ' + from : '';
      quoteEl.classList.remove('fade');
    }, 250);
  }

  /** 随机取一句本地备选 */
  function localQuote() {
    var list = SITE.quotes || [];
    if (!list.length) return;
    var q = list[Math.floor(Math.random() * list.length)];
    showQuote(q.text, q.from);
  }

  /** 获取一句新的一言 */
  function fetchQuote() {
    if (!window.fetch) return localQuote();
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (ctrl) ctrl.abort();
    }, 5000);
    fetch('https://v1.hitokoto.cn/?c=d&c=i&c=k', ctrl ? { signal: ctrl.signal } : {})
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(function (d) {
        showQuote(d.hitokoto, [d.from_who, d.from].filter(Boolean).join(' · '));
      })
      .catch(localQuote)
      .then(function () {
        clearTimeout(timer);
      });
  }

  if (F.hitokoto && quoteEl) {
    // 英文页面直接使用本地句子，避免显示中文接口内容
    SITE.lang === 'zh' ? fetchQuote() : localQuote();
    quoteEl.addEventListener('click', function () {
      SITE.lang === 'zh' ? fetchQuote() : localQuote();
    });
  }

  /* ---------------------------------------------------------------------
     滚动相关：导航栏背景、当前区块高亮、回到顶部和阅读进度、进入动画
     --------------------------------------------------------------------- */
  var topbar = $('#topbar');
  var backTop = $('#back-top');
  var navLinks = $$('[data-nav]');
  var ticking = false;

  /** 滚动时更新的 UI，用 requestAnimationFrame 节流 */
  function onScroll() {
    ticking = false;
    var y = window.scrollY || document.documentElement.scrollTop;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (topbar) topbar.classList.toggle('scrolled', y > 10);
    if (backTop) {
      backTop.classList.toggle('show', y > window.innerHeight * 0.6);
      backTop.style.setProperty('--progress', max > 0 ? Math.min(100, (y / max) * 100).toFixed(1) : 0);
    }
  }

  window.addEventListener(
    'scroll',
    function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true },
  );
  onScroll();

  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  if ('IntersectionObserver' in window) {
    // 元素进入视口时添加 .in 触发动画，并对同一批元素做错峰
    var revealObserver = new IntersectionObserver(
      function (entries) {
        var delay = 0;
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          el.style.transitionDelay = Math.min(delay, 300) + 'ms';
          delay += 60;
          el.classList.add('in');
          revealObserver.unobserve(el);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    $$('.reveal').forEach(function (el) {
      revealObserver.observe(el);
    });

    // 当前所在区块高亮导航
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          navLinks.forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('data-nav') === id);
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    navLinks.forEach(function (a) {
      var target = document.getElementById(a.getAttribute('data-nav'));
      if (target) sectionObserver.observe(target);
    });
  } else {
    $$('.reveal').forEach(function (el) {
      el.classList.add('in');
    });
  }

  /* ---------------------------------------------------------------------
     数字滚动：统计数字从 0 增长到目标值
     --------------------------------------------------------------------- */
  (function countUp() {
    var nums = $$('[data-count]');
    if (!nums.length || reduceMotion || !('IntersectionObserver' in window)) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = Number(el.getAttribute('data-count'));
        var finalText = el.textContent;
        obs.unobserve(el);
        if (!target || target < 5) return;
        var start = performance.now();
        /** 动画帧：缓出曲线 */
        function frame(t) {
          var k = Math.min(1, (t - start) / 1200);
          var eased = 1 - Math.pow(1 - k, 3);
          el.textContent = k < 1 ? Math.round(target * eased) : finalText;
          if (k < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
    });
    nums.forEach(function (n) {
      obs.observe(n);
    });
  })();

  /* ---------------------------------------------------------------------
     移动端菜单
     --------------------------------------------------------------------- */
  var menuBtn = $('#menu-toggle');
  var nav = $('#nav');

  /**
   * 打开或关闭移动端菜单
   * @param {boolean} open 是否打开
   */
  function setMenu(open) {
    if (!menuBtn || !nav) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    navLinks.forEach(function (a) {
      a.addEventListener('click', function () {
        setMenu(false);
      });
    });
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
    });
  }

  /* ---------------------------------------------------------------------
     点击复制、主题按钮
     --------------------------------------------------------------------- */
  document.addEventListener('click', function (e) {
    var target = e.target.closest ? e.target.closest('[data-copy]') : null;
    if (target) copy(target.getAttribute('data-copy'));
  });

  var themeBtn = $('#theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', cycleTheme);

  /* ---------------------------------------------------------------------
     鼠标跟随光晕（仅支持悬停的精确指针设备）
     --------------------------------------------------------------------- */
  (function cursorGlow() {
    var glow = $('#cursor-glow');
    if (!glow || reduceMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var x = 0;
    var y = 0;
    var pending = false;
    window.addEventListener(
      'pointermove',
      function (e) {
        x = e.clientX;
        y = e.clientY;
        glow.classList.add('on');
        if (pending) return;
        pending = true;
        requestAnimationFrame(function () {
          glow.style.transform = 'translate(' + x + 'px,' + y + 'px)';
          pending = false;
        });
      },
      { passive: true },
    );
    document.addEventListener('mouseleave', function () {
      glow.classList.remove('on');
    });
  })();

  /* ---------------------------------------------------------------------
     命令面板：/ 或 Ctrl+K 打开，支持搜索、上下键选择、回车执行
     --------------------------------------------------------------------- */
  var palette = $('#palette');
  var pInput = $('#palette-input');
  var pList = $('#palette-list');
  var pItems = [];
  var pIndex = 0;

  /**
   * 根据关键字过滤并渲染命令列表
   * @param {string} keyword 搜索关键字
   */
  function renderPalette(keyword) {
    var kw = (keyword || '').trim().toLowerCase();
    pItems = (SITE.commands || []).filter(function (c) {
      return !kw || (c.label + ' ' + c.group).toLowerCase().indexOf(kw) !== -1;
    });
    pIndex = 0;
    pList.innerHTML = '';
    if (!pItems.length) {
      var li = document.createElement('li');
      li.className = 'empty';
      li.textContent = I.empty;
      pList.appendChild(li);
      return;
    }
    pItems.forEach(function (c, i) {
      var li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === 0));
      var label = document.createElement('span');
      label.textContent = c.label;
      var group = document.createElement('small');
      group.textContent = c.group;
      li.appendChild(label);
      li.appendChild(group);
      li.addEventListener('click', function () {
        runCommand(c);
      });
      li.addEventListener('mousemove', function () {
        selectPalette(i);
      });
      pList.appendChild(li);
    });
  }

  /**
   * 高亮第 i 个命令
   * @param {number} i 下标
   */
  function selectPalette(i) {
    var lis = $$('li[role="option"]', pList);
    if (!lis.length) return;
    pIndex = (i + lis.length) % lis.length;
    lis.forEach(function (li, j) {
      li.setAttribute('aria-selected', String(j === pIndex));
    });
    lis[pIndex].scrollIntoView({ block: 'nearest' });
  }

  /**
   * 执行命令：跳转锚点、打开链接或执行动作
   * @param {object} c 命令
   */
  function runCommand(c) {
    closePalette();
    if (c.action === 'theme') return cycleTheme();
    if (!c.href) return;
    if (c.external) window.open(c.href, '_blank', 'noopener');
    else location.href = c.href;
  }

  /** 打开命令面板 */
  function openPalette() {
    if (!palette || palette.open) return;
    renderPalette('');
    pInput.value = '';
    if (palette.showModal) palette.showModal();
    else palette.setAttribute('open', '');
    pInput.focus();
  }

  /** 关闭命令面板 */
  function closePalette() {
    if (!palette) return;
    if (palette.close) palette.close();
    else palette.removeAttribute('open');
  }

  if (palette && F.shortcuts) {
    var openBtn = $('#palette-open');
    if (openBtn) openBtn.addEventListener('click', openPalette);
    pInput.addEventListener('input', function () {
      renderPalette(pInput.value);
    });
    pInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectPalette(pIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectPalette(pIndex - 1);
      } else if (e.key === 'Enter' && pItems[pIndex]) {
        e.preventDefault();
        runCommand(pItems[pIndex]);
      }
    });
    // 点击遮罩关闭
    palette.addEventListener('click', function (e) {
      if (e.target === palette) closePalette();
    });
  }

  /* ---------------------------------------------------------------------
     全局快捷键：/ 或 Ctrl+K 命令面板，T 主题，L 语言
     --------------------------------------------------------------------- */
  if (F.shortcuts) {
    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        return openPalette();
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '/') {
        e.preventDefault();
        openPalette();
      } else if (e.key === 't' || e.key === 'T') {
        cycleTheme();
      } else if (e.key === 'l' || e.key === 'L') {
        var sw = $('[data-lang-switch]');
        if (sw) location.href = sw.href;
      }
    });
  }

  /* ---------------------------------------------------------------------
     彩蛋：控制台问候；输入 Konami 秘籍 ↑↑↓↓←→←→BA 切换彩虹模式
     --------------------------------------------------------------------- */
  if (F.easterEgg) {
    if (window.console && console.log) {
      console.log('%c Hi! %c ' + I.eggConsole, 'background:#6366f1;color:#fff;border-radius:4px;padding:2px 6px', 'color:#6366f1');
    }
    var KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    var konamiPos = 0;
    document.addEventListener('keydown', function (e) {
      var key = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key;
      konamiPos = key === KONAMI[konamiPos] ? konamiPos + 1 : key === KONAMI[0] ? 1 : 0;
      if (konamiPos === KONAMI.length) {
        konamiPos = 0;
        var on = document.documentElement.classList.toggle('rainbow');
        if (on) toast(I.eggRainbow);
      }
    });
  }

  /* ---------------------------------------------------------------------
     加载完成：移除加载动画
     --------------------------------------------------------------------- */
  /** 隐藏加载动画（最多等待 2.5 秒，避免外部图片拖慢首屏） */
  function ready() {
    document.body.classList.remove('is-loading');
  }
  if (document.readyState === 'complete') ready();
  else {
    window.addEventListener('load', ready);
    setTimeout(ready, 2500);
  }
})();
