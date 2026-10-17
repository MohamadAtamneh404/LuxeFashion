const {chromium,expect}=require('@playwright/test');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const base=process.env.RETAIL_QA_URL||'http://127.0.0.1:4178/motion-store/';
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  try{
    await page.goto(base+'luxefashion-preview.html#/collections');
    await page.evaluate(()=>document.fonts.ready);
    for(const width of [800,1024,1440]){
      await page.setViewportSize({width,height:1000});
      for(const key of ['new','women','men','collections','editorial','about']){
        const heading=await page.evaluate(key=>{openMega(key);const h=document.querySelector('#mega-title h2'),r=document.createRange();r.selectNodeContents(h);return {lines:r.getClientRects().length,textWidth:r.getBoundingClientRect().width,columnWidth:h.parentElement.clientWidth}},key);
        expect(heading.lines).toBe(1);expect(heading.textWidth).toBeLessThanOrEqual(heading.columnWidth);
      }
    }
    await page.evaluate(()=>closeMega());
    const button=page.locator('.footer-main-cta');
    const firstFrameMinimum=await button.evaluate(async el=>{
      el.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}));
      const samples=[];
      for(let frame=0;frame<12;frame++){await new Promise(requestAnimationFrame);samples.push(parseFloat(getComputedStyle(el).scale)||1)}
      return Math.min(...samples);
    });
    expect(firstFrameMinimum).toBeGreaterThanOrEqual(.99);
    await button.hover();
    await expect.poll(()=>button.evaluate(el=>Number(getComputedStyle(el).getPropertyValue('--interaction-scale')))).toBeGreaterThan(1.01);
    await expect.poll(()=>button.locator('[data-gsap-arrow]').evaluate(el=>parseFloat(getComputedStyle(el).getPropertyValue('--interaction-arrow-x')))).toBeGreaterThan(3);
    await page.mouse.move(0,0);
    await expect.poll(()=>button.evaluate(el=>Number(getComputedStyle(el).getPropertyValue('--interaction-scale')))).toBe(1);
    await page.keyboard.press('Tab');await button.focus();
    await expect.poll(()=>button.evaluate(el=>Number(getComputedStyle(el).getPropertyValue('--interaction-scale')))).toBeGreaterThan(1.01);
    await button.evaluate(el=>el.blur());
    await page.evaluate(()=>nav('/new'));
    const filters=page.locator('.catalog-filters summary');
    await filters.click();
    await expect(page.locator('.filter-fields')).toBeVisible();
    await expect.poll(()=>page.locator('.filter-fields>.field').first().evaluate(el=>el.style.transform)).toBe('');
    await page.getByLabel('Price range',{exact:true}).selectOption('under100');
    await filters.hover();await expect(filters).toHaveAttribute('data-gsap-interaction','supporting');
    await expect.poll(()=>filters.evaluate(el=>Number(getComputedStyle(el).getPropertyValue('--interaction-scale')))).toBe(1);
    await page.emulateMedia({reducedMotion:'reduce'});
    await filters.hover();
    await expect.poll(()=>filters.evaluate(el=>getComputedStyle(el).scale)).toBe('1');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.setViewportSize({width:390,height:844});
    const menu=page.getByRole('button',{name:'Open menu',exact:true});
    await menu.dispatchEvent('pointerdown',{pointerType:'touch',bubbles:true});
    await expect.poll(()=>menu.evaluate(el=>Number(getComputedStyle(el).getPropertyValue('--interaction-scale')))).toBeLessThan(.99);
    await menu.dispatchEvent('pointercancel',{pointerType:'touch',bubbles:true});
    await expect.poll(()=>menu.evaluate(el=>Number(getComputedStyle(el).getPropertyValue('--interaction-scale')))).toBe(1);
    await menu.click();await expect(page.locator('.mobile-panel')).toHaveClass(/open/);
    const disclosure=await page.locator('.mobile-panel details').first().evaluate(async details=>{
      const link=details.querySelector('a');
      const hiddenStyle=link.style.transform;
      details.querySelector('summary').click();
      await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
      return {hiddenStyle,revealed:!!link.style.transform,opacity:Number(link.style.opacity)};
    });
    expect(disclosure.hiddenStyle).toBe('');expect(disclosure.revealed).toBe(true);expect(disclosure.opacity).toBeGreaterThanOrEqual(.8);
    await expect.poll(()=>page.locator('.mobile-panel details').first().locator('a').first().evaluate(el=>el.style.transform)).toBe('');
    await expect.poll(()=>page.evaluate(()=>!!window.luxeScroll)).toBe(true);
    await page.emulateMedia({reducedMotion:'reduce'});await expect.poll(()=>page.evaluate(()=>window.luxeScroll===null)).toBe(true);
    await page.emulateMedia({reducedMotion:'no-preference'});await expect.poll(()=>page.evaluate(()=>!!window.luxeScroll)).toBe(true);
    await page.goto(base+'motion-proof.html');
    await page.setViewportSize({width:1440,height:1000});
    const homeButton=page.locator('.primary-link').first();
    await homeButton.hover();
    await expect.poll(()=>homeButton.evaluate(el=>Number(getComputedStyle(el).getPropertyValue('--interaction-scale')))).toBeGreaterThan(1.01);
    const menuSwitch=await page.evaluate(async()=>{
      const links=document.querySelectorAll('.primary-nav a');
      links[0].dispatchEvent(new MouseEvent('mouseenter'));
      await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
      links[1].dispatchEvent(new MouseEvent('mouseenter'));
      await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
      return !!document.querySelector('.mega-links a').style.transform;
    });
    expect(menuSwitch).toBe(true);
    await page.mouse.move(1100,900);await page.mouse.wheel(0,650);
    await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(300);
    await page.locator('.back-to-top-float').click();await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeLessThan(2);
    expect(errors).toEqual([]);
    console.log('PASS: stable first frames, primary/supporting hierarchy, hover/arrow, keyboard, route controls, filters, reduced motion, touch cancellation, visible submenu reveals, open menu switches, Lenis wheel and back to top');
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
