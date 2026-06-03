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

  /* ---------- 2. CUSTOM CURSOR (Lucide hammer) ---------- */
  const cursor = $('#cursor');
  if (cursor && !isMobile() && !prefersReduced()) {
    let mx = 0, my = 0, cx = 0, cy = 0;
    // El Lucide hammer tiene el mango en la esquina inferior-izquierda (≈2,18 en el viewBox 24×24).
    // Ajustamos para que ese punto sea el "hotspot" del cursor.
    const HOT_X = 2;
    const HOT_Y = 18;
    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    const tick = () => {
      cx += (mx - cx) * 0.2;
      cy += (my - cy) * 0.2;
      cursor.style.transform = `translate3d(${cx - HOT_X}px, ${cy - HOT_Y}px, 0)`;
      requestAnimationFrame(tick);
    };
    tick();
    const hoverSel = 'a, button, .chip, .project, .t-arrow, .hero__arrow, .nav__burger, input, textarea, select';
    const strikeSel = '.btn--whatsapp, .btn--gold, .wa-float, .footer__cta';
    document.addEventListener('mouseover', e => {
      const el = e.target.closest(hoverSel);
      if (!el) return;
      cursor.classList.add('is-hover');
      if (el.matches && el.matches(strikeSel)) cursor.classList.add('is-strike');
    });
    document.addEventListener('mouseout', e => {
      const el = e.target.closest(hoverSel);
      if (!el) return;
      if (el.matches && el.matches(strikeSel)) cursor.classList.remove('is-strike');
      setTimeout(() => {
        if (!document.querySelector(':hover')) cursor.classList.remove('is-hover');
      }, 10);
    });
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
     <video> tiene autoplay+muted+loop+playsinline.
     Auto-reanuda si el navegador lo pausa (por throttling, pestaña
     en background, etc.). NO pausamos en visibilitychange para evitar
     pausas espurias del navegador. */
  const heroVideo = $('.hero__video');
  const saveData = navigator.connection && navigator.connection.saveData;
  if (heroVideo && saveData) {
    // Modo ahorro de datos: no descargar ni reproducir el video.
    heroVideo.preload = 'none';
    heroVideo.removeAttribute('autoplay');
    heroVideo.pause();
  } else if (heroVideo) {
    let userPaused = false;
    heroVideo.addEventListener('pause', () => { /* marca solo pausas del usuario */ });
    heroVideo.addEventListener('play', () => { /* tracking */ });

    // Función de auto-reanudar: si el video se pausa sin que el usuario lo pida,
    // y la pestaña está visible, lo reproducimos de nuevo.
    function keepAlive() {
      if (!heroVideo.paused) return;
      if (userPaused) return;
      if (document.hidden) return;
      if (heroVideo.ended) heroVideo.currentTime = 0;
      const p = heroVideo.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
    // Chequea cada 2s si el video se pausó accidentalmente
    setInterval(keepAlive, 2000);

    // Reanudar al volver a la pestaña
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) keepAlive();
    });
    // Reanudar al recibir foco la ventana
    window.addEventListener('focus', keepAlive);
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

  const emptyMsg = $('#projectsEmpty');
  const applyFilter = (f) => {
    // Featured projects grid
    let visibleFeatured = 0;
    projects.forEach(p => {
      const match = f === 'all' || p.dataset.cat === f;
      p.classList.toggle('is-hidden', !match);
      if (match) visibleFeatured++;
    });
    // Mensaje cuando la categoría no tiene obras destacadas (el portafolio sí las lista)
    if (emptyMsg) emptyMsg.hidden = visibleFeatured > 0;
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
    const waUrl = `https://wa.me/${WA_PHONE}?text=${text}`;
    const mailUrl = `mailto:contacto@aedificateconstructora.com`
      + `?subject=${encodeURIComponent('Nuevo proyecto — ' + data.name)}&body=${text}`;

    status.style.color = 'var(--gold-600)';
    // Abrir DENTRO del gesto del usuario: un setTimeout rompía el gesto y el
    // popup-blocker bloqueaba la pestaña (se perdía el lead).
    const win = window.open(waUrl, '_blank', 'noopener');
    if (win) {
      status.innerHTML = 'Gracias. WhatsApp se abrió en una pestaña nueva. '
        + `Si no apareció, <a href="${waUrl}" target="_blank" rel="noopener">ábrelo aquí</a>.`;
      form.reset();
    } else {
      // Popup bloqueado → ofrecemos enlaces directos (WhatsApp + correo) para no perder el contacto.
      status.innerHTML = `Continúa por <a href="${waUrl}" target="_blank" rel="noopener">WhatsApp</a> `
        + `o envíanos un <a href="${mailUrl}">correo</a>.`;
    }
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
