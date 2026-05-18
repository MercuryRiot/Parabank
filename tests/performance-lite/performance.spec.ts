import { test, expect } from '../../fixtures/base.fixture'
import { config } from '../../config/env.config'

test.describe('@performance - Performance & Load Testing', () => {
  test('PERF-01: Page load time < 5 seconds', async ({ page, transferPage }) => {
    await transferPage.navigate()
    
    const timing = await page.evaluate(() => JSON.parse(JSON.stringify(window.performance.timing)))
    const loadTime = timing.loadEventEnd - timing.navigationStart
    
    console.log('Page load time:', loadTime, 'ms')
    expect(loadTime).toBeLessThan(5000)
  })

  test('PERF-02: API response time average < 2 seconds', async ({ accountPair, api }) => {
    const requests = []
    
    for (let i = 0; i < 20; i++) {
      requests.push(api('GET', `${config.apiBase}/accounts/${accountPair.fromAccountId}`))
    }
    
    const results = await Promise.all(requests)
    const durations = results.map(r => r.durationMs)
    const avg = durations.reduce((a, b) => a + b, 0) / 20
    
    console.table(durations.map((d, i) => ({ request: i + 1, durationMs: d })))
    console.log('Average response time:', avg, 'ms')
    
    expect(avg).toBeLessThan(2000)
  })

  test('PERF-03: 20 parallel requests throughput', async ({ accountPair, api }) => {
    const wallStart = Date.now()
    
    const requests = []
    for (let i = 0; i < 20; i++) {
      requests.push(api('GET', `${config.apiBase}/accounts/${accountPair.fromAccountId}`))
    }
    
    await Promise.all(requests)
    
    const totalMs = Date.now() - wallStart
    const requestsPerSec = (20 / (totalMs / 1000)).toFixed(2)
    
    console.log('Total throughput time:', totalMs, 'ms')
    console.log('Requests/sec:', requestsPerSec)
  })
})
