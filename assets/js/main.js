(() => {
  'use strict';

  const nav = document.querySelector('.nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('on');
        }
      });
    },
    { threshold: 0.12 }
  );
    document.querySelectorAll('.reveal').forEach(el => reveal.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('on'));
  }

  const body = document.body;
  const closeAll = () => {
    document.querySelectorAll('.modal.open').forEach(modal => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    });
    body.classList.remove('modal-open');
  };

  const openModal = id => {
    closeAll();
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    modal.querySelector('.modal-close')?.focus({ preventScroll: true });
  };

  document.querySelectorAll('[data-close-modal]').forEach(button => button.addEventListener('click', closeAll));
  document.querySelectorAll('.modal').forEach(modal => modal.addEventListener('click', event => {
    if (event.target === modal) closeAll();
  }));
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeAll();
    }
  });

  document.querySelectorAll('[data-lightbox]').forEach(image => {
    image.addEventListener('click', event => {
      event.preventDefault();
      const target = document.getElementById('lightboxImage');
      if (!target) return;
      target.src = image.currentSrc || image.src;
      target.alt = image.alt || 'Gallery image';
      openModal('lightboxModal');
    });
  });

  document.querySelectorAll('[data-map-open]').forEach(el => el.addEventListener('click', event => {
    event.preventDefault();
    openModal('mapModal');
  }));
  document.querySelectorAll('[data-contact-open]').forEach(el => el.addEventListener('click', event => {
    event.preventDefault();
    openModal('contactModal');
  }));
  document.querySelectorAll('[data-coming-soon]').forEach(el => el.addEventListener('click', event => {
    event.preventDefault();
    const title = document.getElementById('comingSoonTitle');
    if (title) title.textContent = `${el.dataset.feature || 'Experience'} coming soon.`;
    openModal('comingSoonModal');
  }));

  const form = document.querySelector('#viewingForm');
  if (form) form.addEventListener('submit', event => {
    event.preventDefault();
    document.querySelector('#formToast')?.classList.add('show');
    form.reset();
  });

  // Reusable sliders: the amenities slider autoplays; gallery sliders use buttons/dots only.
  document.querySelectorAll('[data-slider], #amenitySlider').forEach((slider, sliderNumber) => {
    const track = slider.querySelector('.slider-track');
    const slides = [...slider.querySelectorAll('.slide')];
    const dotsWrap = slider.querySelector('[data-slider-dots], .slider-controls');
    let dots = dotsWrap ? [...dotsWrap.querySelectorAll('.dot')] : [];
    if (!track || slides.length < 2) return;

    // Create missing dots if needed.
    if (dotsWrap && dots.length !== slides.length) {
      dotsWrap.innerHTML = '';
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'dot';
        dot.setAttribute('aria-label', `Image ${i + 1}`);
        dotsWrap.appendChild(dot);
      });
      dots = [...dotsWrap.querySelectorAll('.dot')];
    }

    let index = 0;
    let timer = null;
    const autoplay = slider.id === 'amenitySlider' || slider.dataset.autoplay === 'true';

    const go = next => {
      index = (next + slides.length) % slides.length;
      track.style.transform = `translateX(${-index * 100}%)`;
      dots.forEach((dot, i) => {
        const active = i === index;
        dot.classList.toggle('active', active);
        dot.setAttribute('aria-current', active ? 'true' : 'false');
      });

      if (slider.id === 'amenitySlider') {
        const activeSlide = slides[index];
        const title = document.getElementById('amenityInfoTitle');
        const copy = document.getElementById('amenityInfoCopy');
        const tags = document.getElementById('amenityInfoTags');
        if (title && activeSlide.dataset.title) title.textContent = activeSlide.dataset.title;
        if (copy && activeSlide.dataset.copy) copy.textContent = activeSlide.dataset.copy;
        if (tags && activeSlide.dataset.tags) {
          tags.innerHTML = activeSlide.dataset.tags
            .split('|')
            .map(tag => `<span>${tag.trim()}</span>`)
            .join('');
        }
      }
    };

    const restart = () => {
      if (!autoplay) return;
      window.clearInterval(timer);
      timer = window.setInterval(() => go(index + 1), 5000);
    };

    dots.forEach((dot, i) => dot.addEventListener('click', () => { go(i); restart(); }));
    slider.querySelector('[data-slider-prev], #slidePrev, .slider-arrow.prev')?.addEventListener('click', () => { go(index - 1); restart(); });
    slider.querySelector('[data-slider-next], #slideNext, .slider-arrow.next')?.addEventListener('click', () => { go(index + 1); restart(); });

    if (autoplay) {
      slider.addEventListener('mouseenter', () => window.clearInterval(timer));
      slider.addEventListener('mouseleave', restart);
    }

    // Basic touch swipe.
    let startX = 0;
    slider.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 45) { go(index + (dx < 0 ? 1 : -1)); restart(); }
    }, { passive: true });

    go(0);
    restart();
  });

  // The map modal uses a Google Maps embed URL; the CTA button keeps the user-provided share link.
})();

// Mobile navigation + back-to-top ------------------------------------------
(() => {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#mobileMenu');
  const backToTop = document.querySelector('#backToTop');

  const closeMobileMenu = () => {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('nav-open');
  };

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Open navigation menu' : 'Close navigation menu');
      menu.classList.toggle('open', !isOpen);
      menu.setAttribute('aria-hidden', String(isOpen));
      document.body.classList.toggle('nav-open', !isOpen);
    });

    menu.querySelectorAll('a, button').forEach(item => {
      item.addEventListener('click', () => closeMobileMenu());
    });

    document.addEventListener('click', event => {
      if (!menu.classList.contains('open')) return;
      if (!menu.contains(event.target) && !toggle.contains(event.target)) closeMobileMenu();
    });

    window.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMobileMenu();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 820) closeMobileMenu();
    }, { passive: true });
  }

  if (backToTop) {
    const updateBackToTop = () => {
      backToTop.classList.toggle('visible', window.scrollY > 520);
    };
    window.addEventListener('scroll', updateBackToTop, { passive: true });
    updateBackToTop();
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();
