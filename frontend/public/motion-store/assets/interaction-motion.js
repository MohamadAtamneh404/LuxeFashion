/* Shared GSAP feedback; delegated events also cover controls rebuilt by hash routes. */
(() => {
  if (!window.gsap) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const controls = 'button:not(:disabled),a.button,a.primary-link,a.line-link,a.linkline,.category-pills a,.primary-nav a,.nav-link,.mega-links a,.mega-col a,summary';
  const states = new WeakMap();
  const pressed = new Set();
  function control(event) { return event.target.closest?.(controls); }
  function feedback(element, changes) {
    if (!element) return;
    const state = Object.assign(states.get(element) || {hover:false, pressed:false}, changes);
    states.set(element, state);
    element.dataset.gsapInteraction = '';
    const engaged = state.hover || element.matches(':focus-visible');
    const spatial = !reduced.matches;
    gsap.to(element, {
      '--interaction-scale': spatial ? (state.pressed ? .97 : engaged ? 1.015 : 1) : 1,
      duration: state.pressed ? .12 : .65, ease:'power3.out', overwrite:'auto'
    });
    const arrow = element.querySelector('.arrow,.retail-arrow,.back-to-top-float svg,.sort-chevron');
    if (arrow) {
      arrow.dataset.gsapArrow = '';
      gsap.to(arrow, {
        '--interaction-arrow-x': spatial && engaged && !element.matches('.back-to-top-float') ? '4px' : '0px',
        '--interaction-arrow-y': spatial && engaged ? '-3px' : '0px',
        duration:.75, ease:'power3.out', overwrite:'auto'
      });
    }
  }
  document.addEventListener('pointerover', event => {
    const element = control(event);
    if (event.pointerType !== 'touch' && element && !element.contains(event.relatedTarget)) feedback(element,{hover:true});
  });
  document.addEventListener('pointerout', event => {
    const element = control(event);
    if (element && !element.contains(event.relatedTarget)) feedback(element,{hover:false});
  });
  document.addEventListener('focusin', event => feedback(control(event),{}));
  document.addEventListener('focusout', event => feedback(control(event),{pressed:false}));
  document.addEventListener('pointerdown', event => {
    const element = control(event);
    if (element) { pressed.add(element); feedback(element,{pressed:true}); }
  });
  function release() {
    for (const element of pressed) feedback(element,{pressed:false});
    pressed.clear();
  }
  document.addEventListener('pointerup',release);
  document.addEventListener('pointercancel',release);
  window.addEventListener('blur',release);
  document.addEventListener('keydown',event => {
    const element = control(event);
    if (!event.repeat && element && (event.key === 'Enter' || (event.key === ' ' && element.matches('button,summary')))) {
      pressed.add(element); feedback(element,{pressed:true});
    }
  });
  document.addEventListener('keyup',release);

  function reveal(panel) {
    if (reduced.matches) return;
    const items = panel.querySelectorAll('.mega-links a,.mega-col a,.mobile-nav a,.mobile-panel a,.filter-fields>.field');
    gsap.fromTo(items,{y:6,opacity:.8},{y:0,opacity:1,duration:.4,stagger:.035,ease:'power2.out',overwrite:true,clearProps:'transform,opacity'});
  }
  document.addEventListener('toggle',event => {
    if (event.target.matches?.('details.catalog-filters') && event.target.open) reveal(event.target);
  },true);
  const panelObserver = new MutationObserver(records => {
    for (const {target,oldValue} of records) {
      if (target.classList.contains('open') && !(oldValue || '').split(/\s+/).includes('open')) reveal(target);
    }
  });
  function watchMenus() {
    document.querySelectorAll('.mega,.mega-panel,.mobile-nav,.mobile-panel').forEach(panel => {
      panelObserver.observe(panel,{attributes:true,attributeFilter:['class'],attributeOldValue:true});
    });
  }
  watchMenus();
  // Routes replace the header; release the old observer targets before watching the new header.
  const app = document.getElementById('app');
  if (app) new MutationObserver(() => { panelObserver.disconnect(); watchMenus(); }).observe(app,{childList:true});
})();
