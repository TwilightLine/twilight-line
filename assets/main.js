/* ============================================================
   个人主页 · 交互
   原则：动效走 transform / opacity；滚动监听统一走 rAF 合帧
   ============================================================ */
(function(){
  'use strict';

  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. 深浅色切换 ---------- */
  var toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', function(){
      var next = doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      doc.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  /* ---------- 2. 首屏文字入场（分行上移，模拟遮罩） ---------- */
  function heroIn(){
    document.body.classList.add('ready');
  }
  if (reduce) {
    heroIn();
  } else {
    window.requestAnimationFrame(function(){
      window.requestAnimationFrame(heroIn);
    });
  }

  /* ---------- 3. 滚动入场 ---------- */
  var revealItems = [].slice.call(document.querySelectorAll('.reveal'));

  if (reduce || !('IntersectionObserver' in window)) {
    revealItems.forEach(function(el){ el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    revealItems.forEach(function(el){ io.observe(el); });
  }

  /* ---------- 4. 卷首语轮播 ---------- */
  var quotes = [].slice.call(document.querySelectorAll('.epi-q'));
  var dotBox = document.getElementById('epiDots');
  var current = 0;
  var timer = null;

  if (quotes.length && dotBox) {
    quotes.forEach(function(q, i){
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', '第 ' + (i + 1) + ' 句');
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function(){ show(i); restart(); });
      dotBox.appendChild(b);
    });

    var dots = [].slice.call(dotBox.children);

    function show(i){
      if (i === current) return;
      quotes[current].classList.remove('on');
      dots[current].setAttribute('aria-selected', 'false');
      current = i;
      quotes[current].classList.add('on');
      dots[current].setAttribute('aria-selected', 'true');
      fit();
    }

    function next(){ show((current + 1) % quotes.length); }

    function restart(){
      if (timer) clearInterval(timer);
      if (!reduce) timer = setInterval(next, 6000);
    }

    var stack = document.getElementById('epiStack');

    /* 容器高度跟随当前那一句，避免被最长的一条撑出大片空白 */
    function fit(){
      if (!stack || !quotes[current]) return;
      stack.style.height = quotes[current].offsetHeight + 'px';
    }

    fit();
    window.addEventListener('resize', fit);

    if (stack) {
      stack.addEventListener('mouseenter', function(){ if (timer) clearInterval(timer); timer = null; });
      stack.addEventListener('mouseleave', restart);
    }

    restart();
  }

  /* ---------- 5. 顶栏状态 + 阅读进度（合帧处理） ---------- */
  var nav = document.getElementById('nav');
  var bar = document.getElementById('progress');
  var ticking = false;

  function onFrame(){
    ticking = false;
    var y = window.pageYOffset || doc.scrollTop;

    if (nav) {
      if (y > 12) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }

    if (bar) {
      var max = doc.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(y / max, 1) : 0;
      bar.style.transform = 'scaleX(' + ratio + ')';
    }
  }

  function onScroll(){
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onFrame);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onFrame();
})();
