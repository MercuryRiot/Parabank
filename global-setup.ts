import { chromium, expect, request } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { config } from './config/env.config';

const AUTH_DIR = '.auth';

export default async function globalSetup() {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  console.log('[Setup] Created auth directory:', AUTH_DIR);

  const workers = [0, 1];

  for (const workerIndex of workers) {
    // const username = `w${workerIndex}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const username = `w${workerIndex}_${process.hrtime.bigint()}`;
    console.log(`[Setup] Starting setup for worker ${workerIndex} (${username})`);

    let customerId: string | null = null;

    console.log(`[Setup:${workerIndex}] Launching browser for UI registration`);
    const browser = await chromium.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    const registerUrl = `${config.baseUrl}/parabank/register.htm`;
    console.log(`[Setup:${workerIndex}] Navigating to ${registerUrl}`);
    await page.goto(registerUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for form to be interactive
    await expect(page.locator('input[id="customer.firstName"]')).toBeVisible();

    // Fill fields one by one with small delays between
    const fields: [string, string][] = [
      ['input[id="customer.firstName"]', 'John'],
      ['input[id="customer.lastName"]', `Worker${workerIndex}`],
      ['input[id="customer.address.street"]', '123 Test Street'],
      ['input[id="customer.address.city"]', 'Test City'],
      ['input[id="customer.address.state"]', 'CA'],
      ['input[id="customer.address.zipCode"]', '90210'],
      ['input[id="customer.phoneNumber"]', `555000000${workerIndex}`],
      ['input[id="customer.ssn"]', `12345000${workerIndex}`],
      ['input[id="customer.username"]', username],
      ['input[id="customer.password"]', config.password],
      ['input[id="repeatedPassword"]', config.password],
    ];

    for (const [selector, value] of fields) {
      await page.locator(selector).fill(value);
      await page.waitForLoadState('domcontentloaded');
    }

    await page.locator('input[value="Register"]').click();

    // Wait for either success or error
    await expect(page.locator('a[href="logout.htm"], .error')).toBeVisible();

    const errorVisible = await page.locator('.error').isVisible();
    if (errorVisible) {
      const errorText = await page.locator('.error').textContent();
      throw new Error(`Registration failed for ${username}: ${errorText}`);
    }

    const idContext = await request.newContext({
      httpCredentials: { username: username, password: config.password },
      extraHTTPHeaders: { 'Accept': 'application/json' },
    });
    const meRes = await idContext.get(`${config.apiBase}/login/${username}/${config.password}`);
    if (!meRes.ok()) throw new Error(`[Setup:${workerIndex}] Failed to fetch customer via login API: ${meRes.status()}`);
    const meData = await meRes.json();
    customerId = meData.id?.toString();
    if (!customerId) throw new Error(`[Setup:${workerIndex}] Could not parse customerId from response`);
    await idContext.dispose();
    console.log(`[Setup:${workerIndex}] Got customerId=${customerId} for ${username}`);

    console.log(`[Setup:${workerIndex}] Creating API context to fetch accounts for customer ${customerId}`);
    const apiContext = await request.newContext({
      httpCredentials: {
        username: username,
        password: config.password,
      },
      extraHTTPHeaders: { 'Accept': 'application/json' },
    });
    const accountsRes = await apiContext.get(`${config.apiBase}/customers/${customerId}/accounts`);
    if (!accountsRes.ok()) throw new Error(`[Setup:${workerIndex}] Failed to fetch accounts: ${accountsRes.status()}`);
    const accounts = await accountsRes.json();
    const fromAccountId = accounts[0].id?.toString();
    if (!fromAccountId) throw new Error(`[Setup:${workerIndex}] Could not determine fromAccountId from response`);
    console.log(`[Setup:${workerIndex}] Found fromAccountId=${fromAccountId}`);

    const createRes = await apiContext.post(`${config.apiBase}/createAccount?customerId=${customerId}&newAccountType=1&fromAccountId=${fromAccountId}`);
    if (!createRes.ok()) throw new Error(`[Setup:${workerIndex}] Failed to create account: ${createRes.status()}`);
    const created = await createRes.json();
    const toAccountId = created.id?.toString();
    if (!toAccountId) throw new Error(`[Setup:${workerIndex}] Could not determine toAccountId from create response`);
    console.log(`[Setup:${workerIndex}] Created toAccountId=${toAccountId}`);

    await page.goto(`${config.baseUrl}/parabank/transfer.htm`, { waitUntil: 'domcontentloaded', timeout: 20000 });

    const storagePath = path.join(AUTH_DIR, `worker-${workerIndex}.json`);
    await page.context().storageState({ path: storagePath });
    console.log(`[Setup:${workerIndex}] Saved storage state to ${storagePath}`);

    await apiContext.dispose();

    const accountsPath = path.join(AUTH_DIR, `accounts-${workerIndex}.json`);
    const accountData = { workerIndex, username, password: config.password, customerId, fromAccountId, toAccountId };
    fs.writeFileSync(accountsPath, JSON.stringify(accountData, null, 2), 'utf-8');
    console.log(`[Setup:${workerIndex}] Wrote account info to ${accountsPath}`);
  }

  console.log('[Setup] Global setup finished');
}
