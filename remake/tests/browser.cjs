const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/wei40/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    const errors = [], network = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { if (/^https?:/.test(r.url())) network.push(r.url()); });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../../index.html')).href);
    await page.waitForSelector('body[data-ready="true"]');
    assert.equal(await page.locator('body').getAttribute('data-webgl'), 'true');
    await page.locator('#start').click();
    await page.evaluate(() => { __ATC.sim.paused = true; __ATC.updateUI(); });
    await page.locator('[data-command="clearance"]').focus();
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(()=>__ATC.sim.paused),false);
    assert.equal(await page.evaluate(()=>__ATC.sim.aircraft[0].pending),false);
    await page.keyboard.press('Space');
    const advance = async seconds => page.evaluate(seconds => { const s=__ATC.sim;s.paused=false;s.update(seconds);s.paused=true;__ATC.updateUI(); }, seconds);
    await page.locator('[data-command="clearance"]').click();
    assert.equal(await page.locator('[data-command="pending"]').count(), 1);
    await advance(8);
    await page.locator('[data-command="push"]').click();
    await advance(65);
    assert.equal(await page.evaluate(() => __ATC.sim.aircraft[0].state), 'READY_TAXI');
    await page.locator('[data-flight="AE1268"]').click();
    await page.locator('[data-command="ils"]').click();
    await advance(8);
    await page.locator('[data-flight="B78642"]').click();
    await page.locator('[data-command="taxi"]').click();
    await advance(110);
    await page.locator('[data-command="stop"]').click();
    await advance(8);
    const x = await page.evaluate(() => __ATC.sim.aircraft[0].x);
    await advance(10);
    assert.equal(await page.evaluate(() => __ATC.sim.aircraft[0].x), x);
    await page.locator('[data-command="stop"]').click();
    await advance(8);
    assert.ok(await page.evaluate(() => __ATC.sim.aircraft[0].x) < x);
    await page.locator('#follow-plane').click();
    await page.waitForTimeout(900);
    const out=path.resolve(__dirname,'../screenshots');fs.mkdirSync(out,{recursive:true});
    await page.screenshot({ path: path.join(out,'aircraft.png') });
    await page.locator('#apron').click();
    await page.waitForTimeout(4700);
    assert.ok(await page.evaluate(()=>{const row=document.querySelector('#departures .flight-strip:last-child').getBoundingClientRect(),list=document.querySelector('#departures').getBoundingClientRect();return row.bottom<=list.bottom+1;}));
    await page.screenshot({ path: path.join(out,'gameplay.png') });
    await page.locator('#overview').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(out,'overview.png') });
    await page.locator('#sources-button').click();
    assert.ok((await page.locator('#help-body').textContent()).includes('2,524'));
    assert.equal(await page.locator('#help-body a').count(), 7);
    await page.locator('#help-dialog .close-dialog').click();
    // Finish the same UI session using exactly the public gameplay command gates.
    const finished = await page.evaluate(() => {
      const s=__ATC.sim;s.paused=false;
      const desired={PARKED:'clearance',READY_PUSH:'push',READY_TAXI:'taxi',HOLD:'lineup',LINED:'takeoff',DEPARTURE:'departure',ENROUTE:'ils',HOLDING:'ils',VACATED:'taxiin'};
      for(let i=0;i<4000&&!s.finished;i++){
        for(const a of s.aircraft){if(a.completed||a.pending)continue;let id=desired[a.state];if(['APPROACH','FINAL'].includes(a.state))id=a.tower?'land':'tower';if(s.commands(a).some(c=>c.id===id&&!c.disabled))s.execute(id,a.id);}
        s.update(2);
      }
      __ATC.updateUI();return {finished:s.finished,completed:s.completed};
    });
    assert.deepEqual(finished,{finished:true,completed:4});
    assert.equal(await page.locator('#finish-dialog[open]').count(),1);
    assert.equal(await page.locator('#pause').isDisabled(),true);
    await page.locator('#next-shift').click();
    await page.locator('[data-scenario="west"]').click();
    await page.locator('#start').click();
    assert.equal(await page.locator('#rwy').textContent(),'24');
    await page.evaluate(()=>{__ATC.sim.paused=true;__ATC.updateUI();});
    await page.setViewportSize({width:1366,height:768});
    await page.waitForTimeout(700);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.ok(await page.evaluate(()=>document.querySelector('.footer').getBoundingClientRect().bottom<=innerHeight+1));
    await page.screenshot({path:path.join(out,'laptop.png')});
    await page.setViewportSize({width:390,height:844});
    await page.waitForTimeout(700);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});
    assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
    console.log('PASS: offline file launch, WebGL, UI commands/readbacks, taxi hold/resume, camera modes, source links, completed shift, scenario change, laptop/mobile layouts, no runtime errors or network requests.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
