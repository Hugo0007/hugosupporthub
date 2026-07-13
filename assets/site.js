/* ============================================================
   U-GO SUPPORT HUB — shared behavior
   reveals · menu · ticker dup · counters · accordion · pillars
   ============================================================ */
(function () {
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* sticky header border */
  const header = document.querySelector("header");
  addEventListener("scroll", () => {
    header.classList.toggle("scrolled", scrollY > 8);
  }, { passive: true });

  /* fullscreen menu */
  const menuBtn = document.querySelector(".menu-btn");
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const open = document.body.classList.toggle("menu-open");
      menuBtn.setAttribute("aria-expanded", open);
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    document.querySelectorAll(".menu-overlay a").forEach(a =>
      a.addEventListener("click", () => {
        document.body.classList.remove("menu-open");
        menuBtn.setAttribute("aria-expanded", "false");
      })
    );
    addEventListener("keydown", e => {
      if (e.key === "Escape") {
        document.body.classList.remove("menu-open");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* mark active nav link */
  const path = location.pathname.replace(/\/$/, "") || "/";
  document.querySelectorAll(".nav-links a, .menu-overlay a").forEach(a => {
    const href = a.getAttribute("href");
    if (href && href !== "/" && path.startsWith(href)) a.classList.add("active");
    else if (href === "/" && path === "/") a.classList.add("active");
  });

  /* ticker: duplicate track content once for a seamless loop */
  document.querySelectorAll(".ticker-track").forEach(t => {
    t.innerHTML += t.innerHTML;
  });

  /* hero headline: wrap words for staggered rise (home only) */
  const heroH1 = document.querySelector(".hero .h-display");
  if (heroH1) {
    let i = 0;
    (function split(node) {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement("span");
            w.className = "w";
            const inner = document.createElement("span");
            inner.style.setProperty("--i", i++);
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) split(child);
      });
    })(heroH1);
  }
  /* fire entry animations once fonts settle (capped) */
  const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(r => setTimeout(r, 600))])
    .then(() => requestAnimationFrame(() => document.body.classList.add("ready")));
  setTimeout(() => document.body.classList.add("ready"), 1500);

  /* reveal-on-scroll + counters + pillar animations */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      if (en.target.classList.contains("anim-on-view")) en.target.classList.add("anim");
      en.target.querySelectorAll(".count").forEach(runCounter);
      io.unobserve(en.target);
    });
  }, { threshold: 0.18 });
  document.querySelectorAll(".rv, .anim-on-view, .stats").forEach(el => io.observe(el));

  /* story lines get their own, later trigger */
  const ioStory = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add("in"); ioStory.unobserve(en.target); }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll(".story .line").forEach(el => ioStory.observe(el));

  /* counters: animate leading integer, keep suffix ("10–25+" → counts 10) */
  document.querySelectorAll(".stats .num, .cs-outcomes .num").forEach(el => {
    const m = el.textContent.trim().match(/^(\d+)(.*)$/);
    if (m) { el.classList.add("count"); el.dataset.n = m[1]; el.dataset.suffix = m[2]; }
  });
  function runCounter(el) {
    if (el.dataset.done) return;
    el.dataset.done = "1";
    if (REDUCED) return;
    const n = parseInt(el.dataset.n, 10), suffix = el.dataset.suffix, dur = 1200, t0 = performance.now();
    (function tick(t) {
      const p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(n * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* set --len on .draw strokes so dash animations fit each path */
  document.querySelectorAll(".draw").forEach(p => {
    if (p.getTotalLength) {
      const len = Math.ceil(p.getTotalLength());
      p.style.setProperty("--len", len);
    }
  });

  /* FAQ accordion */
  document.querySelectorAll(".faq-item").forEach(item => {
    const q = item.querySelector(".faq-q");
    const a = item.querySelector(".faq-a");
    q.addEventListener("click", () => {
      const open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", open);
      a.style.maxHeight = open ? a.scrollHeight + "px" : "0";
    });
  });
})();
