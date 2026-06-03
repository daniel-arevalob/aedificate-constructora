/* =========================================================
   AEDIFICATE — Interactions
   ========================================================= */
(() => {
  'use strict';

  const $  = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => Array.from(p.querySelectorAll(s));
  const isMobile = () => window.matchMedia('(hover: none)').matches;
  const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. PRELOADER ----------
     No dependemos de 'load' (espera a todas las imágenes).
     Usamos DOMContentLoaded + un timeout de seguridad,
     para que el sitio SIEMPRE salga del loader aunque una
     imagen externa tarde o falle. */
  const hidePreloader = () => {
    document.body.classList.remove('is-loading');
    $('#preloader')?.classList.add('is-done');
  };
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(hidePreloader, 400);
  } else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(hidePreloader, 400), { once: true });
  }
  setTimeout(hidePreloader, 2500);

  /* ---------- 2. CUSTOM CURSOR ---------- */
  const cursor = $('#cursor');
  if (cursor && !isMobile() && !prefersReduced()) {
    let mx = 0, my = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    const tick = () => {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(tick);
    };
    tick();
    const hoverSel = 'a, button, .chip, .project, .t-arrow, .hero__arrow, .nav__burger, input, textarea, select';
    document.addEventListener('mouseover', e => { if (e.target.closest(hoverSel)) cursor.classList.add('is-hover'); });
    document.addEventListener('mouseout',  e => { if (e.target.closest(hoverSel)) cursor.classList.remove('is-hover'); });
  }

  /* ---------- 3. NAV (scroll + mobile) ---------- */
  const nav = $('#nav');
  const onScrollNav = () => nav.classList.toggle('is-scrolled', window.scrollY > 30);
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  const burger = $('#navBurger');
  const mm = $('#mobileMenu');
  const closeMenu = () => { burger?.classList.remove('is-open'); mm?.classList.remove('is-open'); burger?.setAttribute('aria-expanded', 'false'); mm?.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };
  const openMenu  = () => { burger?.classList.add('is-open'); mm?.classList.add('is-open'); burger?.setAttribute('aria-expanded', 'true'); mm?.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; };
  burger?.addEventListener('click', () => mm.classList.contains('is-open') ? closeMenu() : openMenu());
  $$('[data-link]', mm).forEach(a => a.addEventListener('click', closeMenu));
  mm?.querySelector('.mobile-menu__close')?.addEventListener('click', closeMenu);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && mm?.classList.contains('is-open')) closeMenu(); });
  // Cierra el menú móvil si se cruza a desktop (el burger se oculta >1100px y dejaría el menú atascado)
  window.addEventListener('resize', () => { if (window.innerWidth > 1100 && mm?.classList.contains('is-open')) closeMenu(); }, { passive: true });

  /* ---------- 4. SCROLL PROGRESS ---------- */
  const sp = $('#scrollProgress');
  const updateProgress = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    sp.style.width = h > 0 ? `${(window.scrollY / h) * 100}%` : '0';
  };
  window.addEventListener('scroll', updateProgress, { passive: true });

  /* ---------- 5. HERO VIDEO BACKGROUND ----------
     El <video> tiene autoplay+muted+loop+playsinline en el HTML.
     Este bloque solo añade un fallback de play() por si el navegador
     retrasa el autoplay, y pausa/reanuda según visibilidad. */
  const heroVideo = $('.hero__video');
  if (heroVideo) {
    heroVideo.addEventListener('canplay', () => {
      const p = heroVideo.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    });
    // Pausa si la pestaña no está visible (ahorra batería)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) heroVideo.pause();
      else heroVideo.play().catch(() => {});
    });
  }

  /* ---------- 6. INTERSECTION OBSERVER (REVEAL) ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        revealObserver.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  $$('[data-reveal]').forEach(el => revealObserver.observe(el));

  // Hero title line reveal
  const lineObserver = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        $$('[data-reveal-line]', en.target.closest('.hero') || document).forEach((l, i) => {
          setTimeout(() => l.classList.add('is-in'), 200 + i * 140);
        });
        lineObserver.disconnect();
      }
    });
  }, { threshold: 0.2 });
  $$('[data-reveal-line]').forEach(el => lineObserver.observe(el));

  /* ---------- 7. STAT COUNTERS ----------
     Animados mediante script inline en index.html.
     No necesita JS externo; siempre funciona. */

  /* ---------- 8. PROJECTS FILTER ---------- */
  const chips = $$('.chip');
  const projects = $$('.project');
  const portfolioItems = $$('.portfolio__item');
  const portfolioGroups = $$('.portfolio__group');

  const applyFilter = (f) => {
    // Featured projects grid
    projects.forEach(p => {
      const match = f === 'all' || p.dataset.cat === f;
      p.classList.toggle('is-hidden', !match);
    });
    // Portfolio list items
    portfolioItems.forEach(li => {
      const match = f === 'all' || li.dataset.cat === f;
      li.classList.toggle('is-hidden', !match);
    });
    // Auto-hide empty groups, open non-empty ones
    portfolioGroups.forEach(g => {
      const visible = $$('.portfolio__item:not(.is-hidden)', g).length;
      if (visible === 0 && f !== 'all') {
        g.style.display = 'none';
      } else {
        g.style.display = '';
        if (f !== 'all' && visible > 0) g.open = true;
      }
    });
  };

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      applyFilter(chip.dataset.filter);
    });
  });

  /* ---------- 8B. PROJECT MINI-CAROUSEL ----------
     Movido a script inline al final de index.html. */

  /* ---------- 9. TESTIMONIALS SLIDER ----------
     Movido a script inline al final de index.html. */

  /* ---------- 10. CONTACT FORM → WHATSAPP ---------- */
  const form = $('#contactForm');
  const status = $('#formStatus');
  const WA_PHONE = '593995801102';
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.name || !data.email || !data.message) {
      status.textContent = 'Por favor complete los campos obligatorios.';
      status.style.color = '#c0392b';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      status.textContent = 'El correo no es válido.';
      status.style.color = '#c0392b';
      return;
    }
    status.textContent = 'Abriendo WhatsApp...';
    status.style.color = 'var(--gold-600)';

    const lines = [
      `Hola Aedificate, me interesa iniciar un proyecto.`,
      ``,
      `*Nombre:* ${data.name}`,
      `*Correo:* ${data.email}`,
      data.phone ? `*Teléfono:* ${data.phone}` : null,
      data.type ? `*Tipo de proyecto:* ${data.type}` : null,
      data.city ? `*Ciudad:* ${data.city}` : null,
      ``,
      `*Mensaje:*`,
      data.message
    ].filter(Boolean);

    const text = encodeURIComponent(lines.join('\n'));
    const url = `https://wa.me/${WA_PHONE}?text=${text}`;

    setTimeout(() => {
      window.open(url, '_blank', 'noopener');
      status.textContent = 'Gracias. WhatsApp se abrió en una pestaña nueva.';
      form.reset();
    }, 500);
  });

  /* ---------- 11. NEWSLETTER ---------- */
  $('#newsForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input');
    if (input.value) {
      input.value = '';
      input.placeholder = '¡Gracias por suscribirse!';
      setTimeout(() => input.placeholder = 'su@correo.com', 3000);
    }
  });

  /* ---------- 12. SMOOTH SCROLL (fallback) ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top, behavior: prefersReduced() ? 'auto' : 'smooth' });
      }
    });
  });

  /* ---------- 13. YEAR ---------- */
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- 14. HERO REVEAL (panel + lines) ----------
     El panel del hero se anima con CSS @keyframes (no necesita JS).
     Este bloque queda como no-op intencional por si en el futuro
     queremos sincronizar la aparición con carga del video. */
})();
