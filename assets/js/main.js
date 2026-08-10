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

// Floor-plan lightbox zoom: mouse-wheel + touch pinch/pan -------------------
(() => {
  const modal = document.getElementById('lightboxModal');
  const image = document.getElementById('lightboxImage');
  if (!modal || !image) return;

  const card = modal.querySelector('.lightbox-card');
  if (!card) return;

  // Build the zoom UI at runtime so index.html does not need to change.
  let viewport = card.querySelector('.floorplan-zoom-viewport');
  if (!viewport) {
    viewport = document.createElement('div');
    viewport.className = 'floorplan-zoom-viewport';
    image.parentNode.insertBefore(viewport, image);
    viewport.appendChild(image);
  }

  let toolbar = card.querySelector('.floorplan-zoom-toolbar');
  if (!toolbar) {
    toolbar = document.createElement('div');
    toolbar.className = 'floorplan-zoom-toolbar';
    toolbar.setAttribute('aria-label', 'Floor plan zoom controls');
    toolbar.innerHTML = `
      <button type="button" class="floorplan-zoom-button" data-floorplan-zoom-out aria-label="Zoom out">−</button>
      <span class="floorplan-zoom-level" data-floorplan-zoom-level>100%</span>
      <button type="button" class="floorplan-zoom-button" data-floorplan-zoom-in aria-label="Zoom in">+</button>
      <button type="button" class="floorplan-zoom-reset" data-floorplan-zoom-reset>Reset</button>
    `;
    card.insertBefore(toolbar, viewport);
  }

  const level = toolbar.querySelector('[data-floorplan-zoom-level]');
  const zoomIn = toolbar.querySelector('[data-floorplan-zoom-in]');
  const zoomOut = toolbar.querySelector('[data-floorplan-zoom-out]');
  const resetButton = toolbar.querySelector('[data-floorplan-zoom-reset]');

  const MIN_ZOOM = 1;
  const MAX_ZOOM = 5;
  const BUTTON_STEP = 0.25;
  const WHEEL_STEP = 0.14;
  let zoom = 1;
  let active = false;

  const clamp = value => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

  const renderZoom = () => {
    image.style.width = `${zoom * 100}%`;
    image.style.maxWidth = 'none';
    image.style.maxHeight = 'none';
    image.style.height = 'auto';
    if (level) level.textContent = `${Math.round(zoom * 100)}%`;
    zoomOut.disabled = zoom <= MIN_ZOOM + 0.001;
    zoomIn.disabled = zoom >= MAX_ZOOM - 0.001;
  };

  const setZoomAtPoint = (nextZoom, clientX, clientY) => {
    const next = clamp(nextZoom);
    if (Math.abs(next - zoom) < 0.001) return;

    const rect = viewport.getBoundingClientRect();
    const x = clientX == null ? viewport.clientWidth / 2 : clientX - rect.left;
    const y = clientY == null ? viewport.clientHeight / 2 : clientY - rect.top;
    const ratio = next / zoom;

    const newScrollLeft = (viewport.scrollLeft + x) * ratio - x;
    const newScrollTop = (viewport.scrollTop + y) * ratio - y;

    zoom = next;
    renderZoom();
    viewport.scrollLeft = newScrollLeft;
    viewport.scrollTop = newScrollTop;
  };

  const resetZoom = () => {
    zoom = 1;
    renderZoom();
    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
  };

  const setFloorplanMode = isFloorplan => {
    active = isFloorplan;
    card.classList.toggle('floorplan-zoom-active', active);
    toolbar.hidden = !active;
    viewport.classList.toggle('is-floorplan', active);
    resetZoom();
  };

  // Detect which source image opened the existing lightbox.
  document.querySelectorAll('[data-lightbox]').forEach(source => {
    source.addEventListener('click', () => {
      const isFloorplan = Boolean(source.closest('.floorplan-figure')) ||
        /IFC-V86-A10\d/i.test(source.getAttribute('src') || '');
      window.requestAnimationFrame(() => setFloorplanMode(isFloorplan));
    });
  });

  zoomIn.addEventListener('click', () => setZoomAtPoint(zoom + BUTTON_STEP));
  zoomOut.addEventListener('click', () => setZoomAtPoint(zoom - BUTTON_STEP));
  resetButton.addEventListener('click', resetZoom);

  // Desktop / trackpad: wheel up zooms in, wheel down zooms out.
  viewport.addEventListener('wheel', event => {
    if (!active) return;
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    setZoomAtPoint(zoom + direction * WHEEL_STEP, event.clientX, event.clientY);
  }, { passive: false });

  // Desktop: click + drag to pan while zoomed.
  let mouseDragging = false;
  let mouseStartX = 0;
  let mouseStartY = 0;
  let mouseStartScrollLeft = 0;
  let mouseStartScrollTop = 0;

  viewport.addEventListener('mousedown', event => {
    if (!active || zoom <= 1 || event.button !== 0) return;

    event.preventDefault();
    mouseDragging = true;
    mouseStartX = event.clientX;
    mouseStartY = event.clientY;
    mouseStartScrollLeft = viewport.scrollLeft;
    mouseStartScrollTop = viewport.scrollTop;
    viewport.classList.add('is-dragging');
  });

  window.addEventListener('mousemove', event => {
    if (!mouseDragging) return;

    event.preventDefault();
    viewport.scrollLeft = mouseStartScrollLeft - (event.clientX - mouseStartX);
    viewport.scrollTop = mouseStartScrollTop - (event.clientY - mouseStartY);
  });

  const stopMouseDrag = () => {
    if (!mouseDragging) return;
    mouseDragging = false;
    viewport.classList.remove('is-dragging');
  };

  window.addEventListener('mouseup', stopMouseDrag);
  window.addEventListener('blur', stopMouseDrag);

  // Mobile: two-finger pinch zoom + one-finger drag/pan while zoomed.
  let pinchDistance = 0;
  let panX = 0;
  let panY = 0;

  const distanceBetweenTouches = touches => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const midpointOfTouches = touches => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2
  });

  viewport.addEventListener('touchstart', event => {
    if (!active) return;

    if (event.touches.length === 2) {
      event.preventDefault();
      pinchDistance = distanceBetweenTouches(event.touches);
    } else if (event.touches.length === 1) {
      panX = event.touches[0].clientX;
      panY = event.touches[0].clientY;
    }
  }, { passive: false });

  viewport.addEventListener('touchmove', event => {
    if (!active) return;

    if (event.touches.length === 2) {
      event.preventDefault();
      const newDistance = distanceBetweenTouches(event.touches);
      if (!pinchDistance) {
        pinchDistance = newDistance;
        return;
      }

      const center = midpointOfTouches(event.touches);
      const ratio = newDistance / pinchDistance;
      setZoomAtPoint(zoom * ratio, center.x, center.y);
      pinchDistance = newDistance;
      return;
    }

    if (event.touches.length === 1 && zoom > 1) {
      event.preventDefault();
      const touch = event.touches[0];
      viewport.scrollLeft += panX - touch.clientX;
      viewport.scrollTop += panY - touch.clientY;
      panX = touch.clientX;
      panY = touch.clientY;
    }
  }, { passive: false });

  viewport.addEventListener('touchend', event => {
    if (!active) return;
    if (event.touches.length < 2) pinchDistance = 0;
    if (event.touches.length === 1) {
      panX = event.touches[0].clientX;
      panY = event.touches[0].clientY;
    }
  }, { passive: true });

  // Double click/tap-like desktop shortcut to reset.
  viewport.addEventListener('dblclick', event => {
    if (!active) return;
    event.preventDefault();
    resetZoom();
  });

  // Non-floorplan images keep the original lightbox appearance.
  setFloorplanMode(false);
})();
