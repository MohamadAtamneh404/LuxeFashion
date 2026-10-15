(()=>{
  let revealed=false;
  const pending=new Set();
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){if(!entry.isIntersecting)continue;entry.target.dataset.characterReveal='revealed';revealed=true;observer.unobserve(entry.target);pending.delete(entry.target)}
  },{threshold:.2});
  function initialize(){
    for(const previous of pending){if(!previous.isConnected){observer.unobserve(previous);pending.delete(previous)}}
    const brand=document.querySelector('.footer-brand');if(!brand||brand.dataset.characterReveal)return;
    if(revealed||matchMedia('(prefers-reduced-motion:reduce)').matches){brand.dataset.characterReveal='settled';return}
    brand.dataset.characterReveal='ready';pending.add(brand);observer.observe(brand);
  }
  initialize();
  const app=document.getElementById('app');if(app)new MutationObserver(initialize).observe(app,{childList:true,subtree:true});
})();
