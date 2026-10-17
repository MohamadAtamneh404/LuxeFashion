const {chromium,expect}=require('@playwright/test');
const fs=require('fs');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const base=process.env.RETAIL_QA_URL||'http://127.0.0.1:4178/motion-store/';
  fs.mkdirSync('output',{recursive:true});
  const results=[],errors=[];
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const go=async route=>{await page.goto(base+'luxefashion-preview.html#'+route);await expect(page.locator('main')).toBeVisible();await page.waitForFunction(()=>[...document.querySelectorAll('.page-opening-media img')].every(img=>img.complete&&img.naturalWidth>0))};
  const checkBagControls=async()=>{
    for(const row of await page.locator('.bag-row').all()){
      const quantity=await row.locator('.controls').boundingBox(),remove=await row.locator('.bag-actions .textbutton').boundingBox();
      expect(remove.height).toBeGreaterThanOrEqual(44);
      expect(remove.x>=quantity.x+quantity.width || remove.y>=quantity.y+quantity.height).toBe(true);
      for(const button of await row.locator('.controls button').all()){const box=await button.boundingBox();expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44)}
    }
  };
  try{
    await go('/new');await expect(page.locator('.product-card')).toHaveCount(4);await expect(page.locator('.image-opening img')).toHaveCount(2);
    await page.screenshot({path:'output/retail-catalog-desktop.png'});
    await go('/search');await page.getByLabel('Search pieces and stories').fill('Before the Seam');await expect(page.locator('.story-card')).toHaveCount(1);await expect(page.locator('.product-card')).toHaveCount(0);results.push('story search');
    await page.locator('.story-card').first().click();await expect(page.locator('.story-shop .product-card')).toHaveCount(2);results.push('shop the story');
    await go('/collections');await expect(page.locator('.curated-edit')).toHaveCount(3);await page.locator('.curated-edit').first().click();await expect(page.locator('.product-card')).toHaveCount(3);results.push('curated collection route');
    await go('/men');await expect(page.locator('.product-card')).toHaveCount(3);await expect(page.locator('#catalog-filter')).toHaveCount(0);results.push('department filtering');
    await page.locator('.catalog-filters summary').click();await page.getByLabel('Price range',{exact:true}).selectOption('under100');await expect(page.locator('.product-card')).toHaveCount(2);await page.getByLabel('Sort by',{exact:true}).focus();await page.getByLabel('Sort by',{exact:true}).selectOption('high');await expect(page.locator('.product-card h3').first()).toHaveText('Blue Printed Shirt');await expect(page.locator('.catalog-filters')).not.toHaveAttribute('open','');await page.locator('.catalog-filters summary').click();await page.locator('#filter-size').selectOption('XL');await page.reload();await expect(page.locator('#filter-price')).toHaveValue('under100');await expect(page.locator('#filter-size')).toHaveValue('XL');await expect(page.locator('#catalog-sort')).toHaveValue('high');await expect(page.locator('.product-card')).toHaveCount(2);await page.locator('.category-pills').getByRole('link',{name:'Shirts',exact:true}).click();await expect(page.locator('.product-card')).toHaveCount(1);await expect(page.locator('#filter-price')).toHaveValue('under100');await page.getByRole('button',{name:'Clear all filters'}).click();await expect(page.locator('.product-card')).toHaveCount(3);await expect(page.locator('#catalog-sort')).toHaveValue('high');results.push('combined filters, sorting, clear and URL persistence');
    await go('/product/dress');await page.locator('.purchase-controls').getByRole('button',{name:'Add to bag'}).click();await expect(page.locator('.toast')).toContainText('Choose a size');await page.locator('.purchase-controls').getByRole('button',{name:'M',exact:true}).click();await page.locator('.purchase-controls').getByRole('button',{name:'Add to bag'}).click();await expect(page.locator('.bag-count')).toHaveText('1');results.push('size validation and add');
    await go('/bag');await page.getByLabel('Size for Red Draped Dress').selectOption('L');await expect(page.getByLabel('Size for Red Draped Dress')).toHaveValue('L');await page.getByRole('button',{name:'Increase quantity'}).click();await expect(page.locator('.bag-count')).toHaveText('2');await checkBagControls();results.push('bag size, quantity and separated touch controls');
    await go('/checkout');await expect(page.locator('#checkout-form input')).toHaveCount(0);await page.getByRole('button',{name:'Create demo confirmation'}).click();await expect(page.locator('main h1')).toContainText('confirmed');results.push('local demo confirmation');
    await go('/account');await expect(page.locator('input[type=password]')).toHaveCount(0);results.push('password-free demo profile');
    await page.goto(base+'motion-proof.html');await expect(page.locator('.selected-piece-photo')).toBeVisible();await page.getByRole('button',{name:/Coat/}).click();await expect(page.locator('.selected-piece-photo')).toHaveAttribute('src','assets/trench.jpg');await expect(page.locator('#product-link')).toHaveAttribute('href','luxefashion-preview.html#/product/trench');results.push('selected home product/photo/link');
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForFunction(()=>!gsap.isTweening('.hero-copy .cut > span')&&!gsap.isTweening('.hero-film'));await page.screenshot({path:'output/retail-home-desktop.png'});
    for(const width of [320,390,768]){
      await page.setViewportSize({width,height:844});
      for(const route of ['/new','/women','/men','/collections','/editorial','/about','/wishlist','/search','/product/shirt','/bag','/account','/info','/privacy','/story/atelier']){
        await go(route);const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));if(dimensions.scroll>dimensions.width+1)throw Error('Overflow '+width+' '+route+' '+JSON.stringify(dimensions));
        if(route==='/bag')await checkBagControls();
      }results.push('no page overflow at '+width);
    }
    await page.setViewportSize({width:390,height:844});await go('/product/shirt');await expect(page.locator('.mobile-purchase')).toHaveClass(/is-visible/);await page.locator('#sticky-size').selectOption('M');await page.locator('.mobile-purchase').getByRole('button',{name:'Add to bag'}).click();await expect(page.locator('.bag-count')).toHaveText('1');results.push('mobile sticky purchase');
    await expect(page.locator('.mobile-purchase')).toHaveClass(/is-visible/);await page.screenshot({path:'output/retail-product-mobile.png'});await go('/bag');await page.screenshot({path:'output/retail-bag-mobile.png'});await go('/new');await page.screenshot({path:'output/retail-catalog-mobile.png'});
    await page.goto(base+'motion-proof.html');await page.waitForFunction(()=>!gsap.isTweening('.hero-copy .cut > span')&&!gsap.isTweening('.hero-film'));await page.screenshot({path:'output/retail-home-mobile.png'});
    await page.locator('#inspector').scrollIntoViewIfNeeded();await page.screenshot({path:'output/retail-inspector-mobile.png'});
    if(errors.length)throw Error('Browser errors: '+errors.join('; '));
    console.log(JSON.stringify({ok:true,results,errors},null,2));
  }catch(e){await page.screenshot({path:'output/retail-failure.png'}).catch(()=>{});console.error(e);process.exitCode=1}
  finally{await browser.close()}
})();
