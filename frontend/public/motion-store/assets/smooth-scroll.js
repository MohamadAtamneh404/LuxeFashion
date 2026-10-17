/* Lenis 1.3.27 shares GSAP's clock; touch keeps the phone's native momentum. */
(() => {
  if (!window.Lenis || !window.gsap) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let scroll;
  const tick = time => scroll?.raf(time * 1000);
  function configure() {
    gsap.ticker.remove(tick);
    scroll?.destroy();
    scroll = null;
    if (!reduced.matches) {
      scroll = new Lenis({lerp:.1,syncTouch:false,prevent:node => !!node.closest('.mobile-nav,.mobile-panel,.filter-fields,[role="dialog"],textarea,select')});
      if (window.ScrollTrigger) scroll.on('scroll',ScrollTrigger.update);
      gsap.ticker.lagSmoothing(0);
      gsap.ticker.add(tick);
    }
    window.luxeScroll = scroll;
  }
  configure();
  reduced.addEventListener('change',configure);
  window.addEventListener('hashchange',() => {
    if (location.hash.startsWith('#/')) scroll?.scrollTo(window.scrollY,{immediate:true,force:true});
  });
  document.addEventListener('click',event => {
    const anchor = event.target.closest('a[href]');
    if (!scroll || !anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.target || anchor.hasAttribute('download')) return;
    const url = new URL(anchor.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash || url.hash.startsWith('#/')) return;
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (target) {
      event.preventDefault();
      scroll.scrollTo(target,{duration:1,onComplete:() => {target.setAttribute('tabindex','-1');target.focus({preventScroll:true})}});
      history.pushState(null,'',url.hash);
    }
  });
})();
