/* Shared GSAP feedback; delegated events also cover controls rebuilt by hash routes. */
(() => {
  if (!window.gsap) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const controls = 'button:not(:disabled),a.button,a.primary-link,a.line-link,a.linkline,.category-pills a,.primary-nav a,.header-utils a,.utilities a,.nav-link,.mega-links a,.mega-col a,.mobile-nav a,.mobile-panel a,summary';
  const states = new WeakMap();
  const pressed = new Set();
  function control(event) { return event.target.closest?.(controls); }
  function feedback(element, changes) {
    if (!element || element.matches(':disabled,[aria-disabled="true"]')) return;
    const state = Object.assign(states.get(element) || {hover:false, pressed:false}, changes);
    states.set(element, state);
    if (!element.hasAttribute('data-gsap-interaction')) {
      // CSS var() fallbacks are not the starting values GSAP reads.
      gsap.set(element,{'--interaction-scale':1,'--interaction-fill':0});
      element.dataset.gsapInteraction = element.matches('.primary-link,.button.dark,.purchase-controls .button,.mobile-purchase .button') ? 'primary' : 'supporting';
    }
    const primary = element.dataset.gsapInteraction === 'primary';
    const engaged = state.hover || element.matches(':focus-visible');
    const spatial = !reduced.matches;
    state.tween?.kill();
    state.tween = gsap.to(element, {
      '--interaction-scale': spatial ? (state.pressed ? (primary ? .97 : .985) : engaged && primary ? 1.015 : 1) : 1,
      '--interaction-fill': primary && engaged ? 1 : 0,
      duration: state.pressed ? .12 : !engaged ? .22 : primary ? .7 : .25, ease:'power3.out', overwrite:'auto'
    });
    const arrow = element.querySelector('.arrow,.retail-arrow,.back-to-top-float svg,.sort-chevron');
    if (arrow) {
      if (!arrow.hasAttribute('data-gsap-arrow')) gsap.set(arrow,{'--interaction-arrow-x':'0px','--interaction-arrow-y':'0px'});
      arrow.dataset.gsapArrow = '';
      state.arrowTween?.kill();
      state.arrowTween = gsap.to(arrow, {
        '--interaction-arrow-x': spatial && engaged && !element.matches('.back-to-top-float') ? (primary ? '4px' : '2px') : '0px',
        '--interaction-arrow-y': spatial && engaged ? (primary ? '-3px' : '-1px') : '0px',
        duration: engaged ? (primary ? .75 : .3) : .22, ease:'power3.out', overwrite:'auto'
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
    const items = [...panel.querySelectorAll('.mega-links a,.mega-col a,.mobile-nav a,.mobile-panel a,.mobile-nav summary,.mobile-panel summary,.mobile-util button,.filter-fields>.field')].filter(item => {
      const closed = item.closest('details:not([open])');
      return item.getClientRects().length && (!closed || item === closed.querySelector(':scope>summary'));
    });
    gsap.fromTo(items,{y:6,opacity:.8},{y:0,opacity:1,duration:.35,stagger:Math.min(.035,.15/Math.max(1,items.length-1)),ease:'power2.out',overwrite:true,clearProps:'transform,opacity'});
  }
  document.addEventListener('toggle',event => {
    const details = event.target;
    if (!details.matches?.('details.catalog-filters,.mobile-nav details,.mobile-panel details')) return;
    if (details.open) reveal(details);
    else {
      const items = details.querySelectorAll('a,.filter-fields>.field');
      gsap.killTweensOf(items);
      gsap.set(items,{clearProps:'transform,opacity'});
    }
  },true);
  reduced.addEventListener('change',() => {
    if (!reduced.matches) return;
    const items = document.querySelectorAll('.mega-links a,.mega-col a,.mobile-nav a,.mobile-panel a,.mobile-nav summary,.mobile-panel summary,.mobile-util button,.filter-fields>.field');
    gsap.killTweensOf(items);
    gsap.set(items,{clearProps:'transform,opacity'});
  });
  const panelObserver = new MutationObserver(records => {
    const panels = new Set();
    for (const {target,type,oldValue} of records) {
      const panel = target.closest('.mega,.mega-panel,.mobile-nav,.mobile-panel');
      if (panel?.classList.contains('open') && (type === 'childList' || (target === panel && !(oldValue || '').split(/\s+/).includes('open')))) panels.add(panel);
    }
    panels.forEach(reveal);
  });
  function watchMenus() {
    document.querySelectorAll('.mega,.mega-panel,.mobile-nav,.mobile-panel').forEach(panel => {
      panelObserver.observe(panel,{attributes:true,attributeFilter:['class'],attributeOldValue:true,childList:true,subtree:true});
      if (panel.classList.contains('open')) reveal(panel);
    });
  }
  watchMenus();
  // Routes replace the header; release the old observer targets before watching the new header.
  const app = document.getElementById('app');
  if (app) new MutationObserver(() => { panelObserver.disconnect(); watchMenus(); }).observe(app,{childList:true});
})();
