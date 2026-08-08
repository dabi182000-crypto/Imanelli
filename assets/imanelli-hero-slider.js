if (!customElements.get('imanelli-hero-slider')) {
  class ImanelliHeroSlider extends HTMLElement {
    connectedCallback() {
      if (this.dataset.initialized === 'true') return;
      this.dataset.initialized = 'true';
      this.slides = Array.from(this.querySelectorAll('[data-slide]'));
      this.dots = Array.from(this.querySelectorAll('[data-dot]'));
      this.previousButton = this.querySelector('[data-previous]');
      this.nextButton = this.querySelector('[data-next]');
      this.status = this.querySelector('[data-slider-status]');
      this.current = Math.max(0, this.slides.findIndex((slide) => slide.classList.contains('is-active')));
      this.interval = Number.parseInt(this.dataset.interval, 10) || 6000;
      this.autoplay = this.dataset.autoplay === 'true' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.pointerStart = null;

      this.previousButton?.addEventListener('click', () => this.show(this.current - 1, true));
      this.nextButton?.addEventListener('click', () => this.show(this.current + 1, true));
      this.dots.forEach((dot) => dot.addEventListener('click', () => this.show(Number(dot.dataset.dot), true)));
      this.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') this.show(this.current - 1, true);
        if (event.key === 'ArrowRight') this.show(this.current + 1, true);
      });
      this.addEventListener('pointerdown', (event) => {
        this.pointerStart = event.clientX;
      });
      this.addEventListener('pointerup', (event) => {
        if (this.pointerStart === null) return;
        const distance = event.clientX - this.pointerStart;
        this.pointerStart = null;
        if (Math.abs(distance) < 45) return;
        this.show(distance > 0 ? this.current - 1 : this.current + 1, true);
      });
      this.addEventListener('mouseenter', () => this.stop());
      this.addEventListener('mouseleave', () => this.start());
      this.addEventListener('focusin', () => this.stop());
      this.addEventListener('focusout', (event) => {
        if (!event.relatedTarget || !this.contains(event.relatedTarget)) this.start();
      });

      this.show(this.current, false);
      this.start();
    }

    disconnectedCallback() {
      this.stop();
    }

    show(index, userInitiated) {
      if (!this.slides.length) return;
      const next = (index + this.slides.length) % this.slides.length;
      this.slides.forEach((slide, slideIndex) => {
        const active = slideIndex === next;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
        slide.querySelectorAll('a, button').forEach((control) => {
          if (active) control.removeAttribute('tabindex');
          else control.setAttribute('tabindex', '-1');
        });
      });
      this.dots.forEach((dot, dotIndex) => {
        const active = dotIndex === next;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      this.current = next;
      if (this.status) this.status.textContent = `Slide ${next + 1} of ${this.slides.length}`;
      if (userInitiated) {
        this.stop();
        this.start();
      }
    }

    start() {
      if (!this.autoplay || this.slides.length < 2 || this.timer) return;
      this.timer = window.setInterval(() => this.show(this.current + 1, false), this.interval);
    }

    stop() {
      if (!this.timer) return;
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  customElements.define('imanelli-hero-slider', ImanelliHeroSlider);

  document.addEventListener('shopify:block:select', (event) => {
    const slide = event.target.closest('[data-slide]');
    const slider = slide?.closest('imanelli-hero-slider');
    if (!slider || typeof slider.show !== 'function') return;
    slider.show(slider.slides.indexOf(slide), true);
  });
}
