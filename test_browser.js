const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('requestfailed', request => {
        console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
    });

    console.log("Navigating...");
    await page.goto('http://localhost:8000');
    
    console.log("Waiting for map...");
    await page.waitForSelector('#map');
    
    console.log("Waiting 6 seconds for overpass API...");
    await new Promise(r => setTimeout(r, 6000));
    
    console.log("Clicking 500, 500...");
    await page.mouse.click(500, 500);
    
    console.log("Waiting 1s...");
    await new Promise(r => setTimeout(r, 1000));

    console.log("Clicking 600, 600...");
    await page.mouse.click(600, 600);
    
    console.log("Waiting 1s...");
    await new Promise(r => setTimeout(r, 1000));
    
    await browser.close();
    console.log("Done");
})();
