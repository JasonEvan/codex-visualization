// Optional developer check: npm install --no-save playwright && npx playwright install chromium
// Run npm start in another terminal first. Not part of npm test.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:4173/');
 await page.locator('#demo-mode').click();
 await page.waitForSelector('.room-row');
 assert.equal(await page.locator('#webgl-error').isVisible(),false,'WebGL scene must initialize');
 assert.equal(await page.locator('.room-row').count(),7);
 await page.locator('[data-room="sample-a"]').click();
 await page.locator('[data-agent="sample-agent-0"]').click();
 assert.equal(await page.locator('.detail-title h2').textContent(),'Rubi');
 await page.locator('#tour-tab').click();await page.locator('#tour-next').click();
 assert.equal(await page.locator('#tour-title').textContent(),'Proyek Contoh B');
 await page.locator('#world-tab').click();
 await page.locator('#pause').click();
 await page.locator('#zoom-in').click();await page.locator('#rotate').click();await page.locator('#reset').click();
 await page.locator('#sound-open').click();await page.locator('#music-toggle').check();await page.locator('#mute-all').click();assert.equal(await page.locator('#music-toggle').isChecked(),false);await page.keyboard.press('Escape');
 await mkdir('test-results',{recursive:true});
 await page.screenshot({path:'test-results/desktop.png'});
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'test-results/mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('Browser smoke checks passed. Screenshots saved in test-results.');
} finally { await browser.close(); }
