import { test as base, expect } from '@playwright/test'
import { TransferFundsPage } from '../pages/TransferFundsPage'
import { AccountOverviewPage } from '../pages/AccountOverviewPage'
import * as fs from 'fs'

const NUM_WORKERS = 2;

interface AccountPair {
  workerIndex: number;
  username: string;
  customerId: string;
  fromAccountId: string;
  toAccountId: string;
}

interface ApiResponse {
  status: number;
  body: unknown;
  durationMs: number;
}

// Simple inline API client — no separate file needed
async function apiCall(
  method: 'GET' | 'POST',
  url: string,
  context: import('@playwright/test').APIRequestContext
): Promise<ApiResponse> {
  const makeRequest = async () => {
    const start = Date.now();
    const res = method === 'GET'
      ? await context.get(url)
      : await context.post(url);
    const durationMs = Date.now() - start;
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    return { status: res.status(), body, durationMs };
  };

  let result = await makeRequest();
  if (result.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    result = await makeRequest();
  }

  // Give ParaBank time to commit after transfers before subsequent GETs
  if (method === 'POST') {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('[apiCall]', method, url, 'status:', result.status, 'body:', JSON.stringify(result.body).slice(0, 200));
  return result;
}

type MyFixtures = {
  transferPage: TransferFundsPage;
  overviewPage: AccountOverviewPage;
  accountPair: AccountPair;
  api: (method: 'GET' | 'POST', url: string) => Promise<ApiResponse>;
};

export const test = base.extend<MyFixtures>({
  context: async ({ browser }, use, testInfo) => {
    const i = testInfo.workerIndex % NUM_WORKERS;
    const ctx = await browser.newContext({
      storageState: `.auth/worker-${i}.json`,
    });
    await use(ctx);
    await ctx.close();
  },

  accountPair: async ({}, use, testInfo) => {
    const i = testInfo.workerIndex % NUM_WORKERS;
    const accountsPath = `.auth/accounts-${i}.json`;
    const data = JSON.parse(fs.readFileSync(accountsPath, 'utf-8'));
    await use(data);
  },

  transferPage: async ({ page }, use) => {
    await use(new TransferFundsPage(page));
  },

  overviewPage: async ({ page }, use) => {
    await use(new AccountOverviewPage(page));
  },

  api: async ({ playwright }, use, testInfo) => {
    const i = testInfo.workerIndex % NUM_WORKERS;
    const data = JSON.parse(fs.readFileSync(`.auth/accounts-${i}.json`, 'utf-8'));
    const apiCtx = await playwright.request.newContext({
      httpCredentials: { username: data.username, password: data.password },
      extraHTTPHeaders: { 'Accept': 'application/json' },
    });

    await use(async (method, url) => apiCall(method, url, apiCtx));

    await apiCtx.dispose();
  },
});

export { expect };
