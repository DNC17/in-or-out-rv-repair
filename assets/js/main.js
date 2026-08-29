/* ══════════════════════════════════════════════════════════════
   In or Out RV Parts & Repair — main.js
   GSAP + ScrollTrigger + Lenis, with a Three.js hero treatment.
   ══════════════════════════════════════════════════════════════ */

import { initHeroGL, shouldUseGL } from './hero-gl.js';

// `?motion=off` forces the same code path as prefers-reduced-motion. Handy for
// QA/screenshots and for anyone who wants to link a motion-free version.
const FORCED_STILL = new URLSearchParams(location.search).get('motion') === 'off';
const REDUCED = FORCED_STILL ||
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (FORCED_STILL) document.documentElement.classList.add('motion-off');

gsap.registerPlugin(ScrollTrigger);
const HAS_SPLIT = typeof SplitText !== 'undefined';
if (HAS_SPLIT) gsap.registerPlugin(SplitText);

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ────────────────────────────────────────────────
   1. Smooth scroll (Lenis) wired into ScrollTrigger
   ──────────────────────────────────────────────── */
let lenis = null;

function initScroll() {
  if (REDUCED || typeof Lenis === 'undefined') return;

  lenis = new Lenis({
    duration: 1.05,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  ScrollTrigger.scrollerProxy(document.body, {
    scrollTop(value) {
      return arguments.length ? lenis.scrollTo(value, { immediate: true }) : lenis.scroll;
    }
  });
}

function scrollToTarget(target) {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.15 });
  else el.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
}

/* ────────────────────────────────────────────────
   2. Preloader
   ──────────────────────────────────────────────── */
function initLoader(onDone) {
  const loader = $('#loader');
  const bar    = $('#loaderBar');
  const pct    = $('#loaderPct');
  const words  = $$('.loader__word');
  const or     = $('.loader__or');

  // No loader markup (it's commented out in index.html) or reduced motion:
  // go straight to the page.
  if (!loader || REDUCED) {
    if (loader) loader.remove();
    document.body.classList.add('is-ready');
    onDone();
    return;
  }

  const state = { v: 0 };
  const tl = gsap.timeline();

  tl.to(words, { opacity: 1, y: 0, duration: .7, stagger: .1, ease: 'power3.out' })
    .to(or, { opacity: 1, duration: .5 }, '-=.45')
    .to(state, {
      v: 100,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate() {
        const v = Math.round(state.v);
        pct.textContent = v;
        bar.style.width = v + '%';
      }
    }, '-=.35')
    .to('.loader__inner', { y: -26, opacity: 0, duration: .55, ease: 'power2.in' })
    .to(loader, {
      yPercent: -100,
      duration: .95,
      ease: 'expo.inOut',
      onComplete() {
        loader.remove();
        document.body.classList.add('is-ready');
        ScrollTrigger.refresh();
      }
    }, '-=.15')
    .add(onDone, '-=.75');
}

/* ────────────────────────────────────────────────
   3. Hero — video + optional WebGL treatment
   ──────────────────────────────────────────────── */
function initHero() {
  const hero   = $('#hero');
  const video  = $('#heroVideo');
  const source = $('#heroSrc');
  const canvas = $('#heroGL');
  if (!hero || !video || !source || !canvas) return;   // pages without a hero

  // Lighter file on small screens / narrow data plans.
  const slim = window.innerWidth < 900 ||
               (navigator.connection && navigator.connection.saveData);
  if (slim) {
    source.src = 'assets/video/hero-mobile.mp4';
    video.load();
  }

  const play = () => {
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
  };
  if (video.readyState >= 2) play();
  video.addEventListener('canplay', play, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) play();
  });

  // `loop` handles the normal case. This is the safety net for when it
  // doesn't fire — a stalled range request or a decoder hiccup can leave the
  // video parked on its last frame instead of wrapping.
  video.addEventListener('ended', () => {
    video.currentTime = 0;
    play();
  });
  video.addEventListener('pause', () => {
    // Nothing should ever pause this; it's decorative and always looping.
    if (!document.hidden && !video.ended) play();
  });

  let gl = null;
  if (shouldUseGL({ reduced: REDUCED })) {
    gl = initHeroGL({ canvas, video });
    if (gl) {
      hero.classList.add('is-gl');
      // Wipe the footage in from the paper colour.
      const wipe = { v: 0 };
      gl.setEnter(0);
      gsap.to(wipe, {
        v: 1,
        duration: 1.4,
        ease: 'power2.out',
        onUpdate() { gl.setEnter(wipe.v); },
        onComplete() { gl.setEnter(1); }
      });
    }
  }

  if (REDUCED) return;

  // Scroll: parallax the copy, drive the shader, fade the plain video.
  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate(self) {
      if (gl) gl.setProgress(self.progress);
    }
  });

  gsap.to('.hero__body', {
    y: () => window.innerHeight * 0.16,
    opacity: .15,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
  });

  if (!gl) {
    gsap.to('.hero__media', {
      scale: 1.14,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
    });
  }
}

function heroIntro() {
  if (REDUCED || !$('.hero__title')) return;

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

  if (HAS_SPLIT) {
    const split = new SplitText('.hero__title .line', { type: 'chars,words' });
    gsap.set(split.chars, { yPercent: 118, opacity: 0 });
    tl.to(split.chars, {
      yPercent: 0, opacity: 1, duration: 1.25, stagger: 0.022
    });
  } else {
    tl.from('.hero__title .line', { yPercent: 110, duration: 1.1, stagger: .1 });
  }

  tl.to('.eyebrow--hero', { opacity: 1, y: 0, duration: .8 }, '-=1.0')
    .to('.hero__sub',     { opacity: 1, y: 0, duration: .8 }, '-=.75')
    .to('.hero__cta',     { opacity: 1, y: 0, duration: .8 }, '-=.68');
}

/* ────────────────────────────────────────────────
   4. Navigation + mobile drawer
   ──────────────────────────────────────────────── */
function initNav() {
  const nav    = $('#nav');
  const burger = $('#burger');
  const drawer = $('#drawer');
  const links  = $$('[data-nav]');

  ScrollTrigger.create({
    start: 'top -60',
    end: 99999,
    onUpdate(self) { nav.classList.toggle('is-stuck', self.scroll() > 60); },
    onToggle(self) { nav.classList.toggle('is-stuck', self.isActive); }
  });

  let open = false;
  const setDrawer = next => {
    open = next;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    drawer.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (lenis) open ? lenis.stop() : lenis.start();
    $$('.drawer__links a').forEach((a, i) => {
      a.style.setProperty('--d', open ? `${0.16 + i * 0.06}s` : '0s');
    });
  };

  burger.addEventListener('click', () => setDrawer(!open));
  $$('.drawer a').forEach(a => a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    setDrawer(false);
    if (href && href.startsWith('#')) {
      e.preventDefault();
      setTimeout(() => scrollToTarget(href), 380);
    }
  }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) setDrawer(false); });

  // In-page anchors
  $$('a[href^="#"]').forEach(a => {
    if (a.closest('.drawer')) return;
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    a.addEventListener('click', e => {
      const el = $(href);
      if (!el) return;
      e.preventDefault();
      scrollToTarget(el);
    });
  });

  // Scroll-spy
  links.forEach(link => {
    const el = $(link.getAttribute('href'));
    if (!el) return;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle(self) {
        if (self.isActive) {
          links.forEach(l => l.classList.remove('is-current'));
          link.classList.add('is-current');
        }
      }
    });
  });
}

/* ────────────────────────────────────────────────
   5. Ticker — infinite marquee, skewed by scroll velocity
   ──────────────────────────────────────────────── */
function initTicker() {
  const track = $('#tickerTrack');
  const set   = $('.ticker__set');
  if (!track || !set) return;

  // Clone until the track comfortably overflows twice over.
  const need = Math.ceil((window.innerWidth * 2) / set.offsetWidth) + 1;
  for (let i = 0; i < need; i++) track.appendChild(set.cloneNode(true));

  if (REDUCED) return;

  const w = set.offsetWidth;
  const tween = gsap.to(track, {
    x: -w,
    duration: w / 62,
    ease: 'none',
    repeat: -1,
    modifiers: { x: gsap.utils.unitize(x => parseFloat(x) % w) }
  });

  // Speed up + skew with scroll velocity.
  ScrollTrigger.create({
    trigger: '.ticker',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate(self) {
      const v = gsap.utils.clamp(-2.6, 2.6, self.getVelocity() / 380);
      tween.timeScale(gsap.utils.clamp(0.4, 4, 1 + Math.abs(v)));
      gsap.to(track, { skewX: -v * 2.2, duration: .5, ease: 'power3.out', overwrite: 'auto' });
    }
  });
}

/* ────────────────────────────────────────────────
   6. Reveals — split headings + fades
   ──────────────────────────────────────────────── */
function initReveals() {
  if (REDUCED) {
    gsap.set('[data-fade]', { opacity: 1, y: 0 });
    return;
  }

  $$('[data-split]').forEach(el => {
    if (!HAS_SPLIT) {
      gsap.from(el, {
        opacity: 0, y: 34, duration: .9, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 84%' }
      });
      return;
    }

    // `mask: 'lines'` gives each line its own overflow-hidden wrapper, and
    // `autoSplit` re-measures on resize and after webfonts land. Without it the
    // line boxes stay frozen at whatever width they were first measured at,
    // which leaves headings broken into one word per line.
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      linesClass: 'sp-line',
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 110,
          duration: 1.05,
          ease: 'expo.out',
          stagger: .07,
          scrollTrigger: { trigger: el, start: 'top 84%', once: true }
        });
      }
    });
  });

  $$('[data-fade]').forEach(el => {
    if (el.closest('.hero')) return; // handled by the hero intro
    gsap.to(el, {
      opacity: 1, y: 0, duration: .95, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%' }
    });
  });

  // Service tiles cascade in
  if ($('.svc__i')) gsap.from('.svc__i', {
    opacity: 0, y: 40, duration: .8, ease: 'expo.out', stagger: .05,
    scrollTrigger: { trigger: '.svc', start: 'top 80%' }
  });

  // Review cards
  if ($('.rev__q')) gsap.from('.rev__q', {
    opacity: 0, y: 44, duration: .95, ease: 'expo.out', stagger: .1,
    scrollTrigger: { trigger: '.rev__grid', start: 'top 82%' }
  });

  // Footer wordmark
  if ($('.foot__mark span')) gsap.from('.foot__mark span, .foot__mark em', {
    yPercent: 105, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .08,
    scrollTrigger: { trigger: '.foot', start: 'top 88%' }
  });
}

/* ────────────────────────────────────────────────
   7. Sticky mobile call bar
   ──────────────────────────────────────────────── */
function initCallbar() {
  const bar = $('.callbar');
  if (!bar) return;
  if (!$('#hero')) {                       // no hero to trigger off — show it once scrolled
    ScrollTrigger.create({
      start: 'top -200', end: 99999,
      onUpdate(self) { bar.classList.toggle('is-in', self.scroll() > 200); }
    });
    return;
  }
  ScrollTrigger.create({
    trigger: '#hero',
    start: 'bottom 80%',
    onEnter: () => bar.classList.add('is-in'),
    onLeaveBack: () => bar.classList.remove('is-in')
  });
  // Get out of the way of the footer
  ScrollTrigger.create({
    trigger: '.foot',
    start: 'top 90%',
    onEnter: () => bar.classList.remove('is-in'),
    onLeaveBack: () => bar.classList.add('is-in')
  });
}

/* ────────────────────────────────────────────────
   Boot
   ──────────────────────────────────────────────── */
function boot() {
  const yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();

  initScroll();
  initHero();
  initNav();
  initTicker();
  initReveals();
  initCallbar();

  initLoader(heroIntro);

  // Fonts can change layout enough to matter for pinned/split sections.
  if (document.fonts) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
