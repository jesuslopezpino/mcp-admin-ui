const { chromium } = require('@playwright/test');

async function testPollingControls() {
  console.log('🚀 Testing polling controls in executions table...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Capture console logs
    page.on('console', msg => {
      console.log('🖥️ Browser Console:', msg.text());
    });
    
    // Capture network requests
    page.on('request', request => {
      console.log('📤 Request:', request.method(), request.url());
    });
    
    page.on('response', response => {
      console.log('📥 Response:', response.status(), response.url());
    });
    
    console.log('📱 Navigating to executions page...');
    await page.goto('http://localhost:4200/executions?hasResponseJson=false&page=0&size=20');
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForLoadState('networkidle');
    
    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: 'executions-polling-controls.png', fullPage: true });
    
    console.log('🔍 Looking for polling controls...');
    const pollingToggle = await page.locator('[data-testid="polling-toggle"]');
    const toggleExists = await pollingToggle.count() > 0;
    console.log('Polling toggle exists:', toggleExists);
    
    if (toggleExists) {
      console.log('✅ Polling toggle found!');
      
      // Check if polling is initially disabled
      const isChecked = await pollingToggle.isChecked();
      console.log('Initial polling state:', isChecked ? 'enabled' : 'disabled');
      
      if (!isChecked) {
        console.log('🔄 Enabling polling...');
        await pollingToggle.check();
        await page.waitForTimeout(1000);
        
        // Check if interval selector appears
        const intervalSelector = await page.locator('[data-testid="polling-interval"]');
        const intervalExists = await intervalSelector.count() > 0;
        console.log('Interval selector appears:', intervalExists);
        
        if (intervalExists) {
          console.log('✅ Interval selector appeared!');
          
          // Check available options
          const options = await intervalSelector.locator('option').all();
          console.log(`Found ${options.length} polling interval options:`);
          
          for (let i = 0; i < options.length; i++) {
            const option = options[i];
            const value = await option.getAttribute('value');
            const text = await option.textContent();
            console.log(`  - ${value}: ${text}`);
          }
          
          // Test changing interval
          console.log('🔄 Changing polling interval to 10 seconds...');
          await intervalSelector.selectOption('10');
          await page.waitForTimeout(1000);
          
          console.log('✅ Polling interval changed successfully!');
        }
        
        // Test disabling polling
        console.log('⏸️ Disabling polling...');
        await pollingToggle.uncheck();
        await page.waitForTimeout(1000);
        
        // Check if interval selector disappears
        const intervalSelectorAfter = await page.locator('[data-testid="polling-interval"]');
        const intervalExistsAfter = await intervalSelectorAfter.count() > 0;
        console.log('Interval selector still visible after disabling:', intervalExistsAfter);
        
        if (!intervalExistsAfter) {
          console.log('✅ Interval selector correctly hidden when polling disabled!');
        }
      }
    } else {
      console.log('❌ Polling toggle not found');
    }
    
    console.log('✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testPollingControls();
