/* Shared navigation feedback and selected-product evidence on the motion home. */
(() => {
  const validIds=new Set(['dress','trench','trousers','sweater','coat','tee','shirt']);
  function bagCount(){try{return JSON.parse(localStorage.getItem('lf_bag')||'[]').filter(i=>validIds.has(i.id)).reduce((n,i)=>n+Math.min(10,Math.max(0,Number(i.qty)||0)),0)}catch{return 0}}
  function updateBag(){const badge=document.querySelector('.home-bag-count');if(badge)badge.textContent=String(bagCount());const link=document.querySelector('.site-header .bag-link');if(link)link.setAttribute('aria-label',`Bag, ${bagCount()} items`)}
  updateBag();window.addEventListener('pageshow',updateBag);window.addEventListener('storage',updateBag);
  const status=document.getElementById('toast-root');if(status){status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true')}
  const picker=document.querySelector('.product-picker');
  if(picker){
    const products=[['dress.jpg','Red Draped Dress'],['trench.jpg','Camel Belted Coat'],['coat.jpg','Terracotta Zip Jacket'],['trousers.jpg','Rose Tapered Trousers']];
    const photo=document.createElement('img');photo.className='selected-piece-photo';photo.width=1000;photo.height=1500;photo.loading='lazy';
    const update=()=>{const selected=picker.querySelector('[aria-pressed="true"]');const product=products[Number(selected?.dataset.product)||0];photo.src='assets/'+product[0];photo.alt='Selected piece: '+product[1]};
    document.querySelector('.product-copy').prepend(photo);update();
    picker.addEventListener('click',event=>{if(event.target.closest('[data-product]'))update()});
  }
  function drawArrows(){
    for(const node of document.querySelectorAll('.arrow,.footer-main-cta span[aria-hidden],.newsletter-field button span[aria-hidden]')){
      if(node.querySelector('svg')||!/[↗↑]/.test(node.textContent))continue;
      const up=node.textContent.includes('↑');node.innerHTML=`<svg class="retail-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="${up?'M12 19V5M5 12l7-7 7 7':'M5 19 19 5M5 5h14v14'}"/></svg>`;
    }
  }
  drawArrows();const app=document.getElementById('app');if(app)new MutationObserver(drawArrows).observe(app,{childList:true,subtree:true});
})();
