(()=>{
  const button=document.createElement('button');
  button.type='button';button.className='back-to-top-float';button.setAttribute('aria-label','Back to top');button.title='Back to top';
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg>';
  button.addEventListener('click',()=>{
    document.querySelector('.mobile-nav.open')?.classList.remove('open');
    document.querySelector('.mobile-panel.open')?.classList.remove('open');
    document.querySelectorAll('[aria-controls="mobile-panel"],[aria-controls="mobile-nav"]').forEach(toggle=>toggle.setAttribute('aria-expanded','false'));
    window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
  });
  document.body.append(button);
  function visibility(){button.classList.toggle('is-visible',window.scrollY>240)}
  visibility();window.addEventListener('scroll',visibility,{passive:true});window.addEventListener('resize',visibility);window.addEventListener('pageshow',visibility);
  function label(){const ar=document.documentElement.lang==='ar';button.setAttribute('aria-label',ar?'العودة إلى الأعلى':'Back to top');button.title=ar?'العودة إلى الأعلى':'Back to top'}
  label();new MutationObserver(label).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
