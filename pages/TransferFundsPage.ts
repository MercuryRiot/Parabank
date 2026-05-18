import { Page, expect } from '@playwright/test'

export class TransferFundsPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/parabank/transfer.htm');
    await expect(this.page.locator('select[id="fromAccountId"]')).toBeAttached();
  }

  async setAmount(amount: string) {
    await this.page.locator('input[id="amount"]').fill(amount);
  }

  async selectFromAccount(accountId: string) {
    const select = this.page.locator('select[id="fromAccountId"]');
    await expect(select.locator(`option[value="${accountId}"]`)).toBeAttached();
    await select.selectOption(accountId);
  }

  async selectToAccount(accountId: string) {
    const select = this.page.locator('select[id="toAccountId"]');
    await expect(select.locator(`option[value="${accountId}"]`)).toBeAttached();
    await select.selectOption(accountId);
  }

  async clickTransfer() {
    await this.page.getByRole('button', { name: 'Transfer' }).click();
  }

  // Fires multiple clicks rapidly without awaiting between — for concurrency test TC-E2E-03
  async multiClickTransfer(times: number) {
    const btn = this.page.getByRole('button', { name: 'Transfer' });
    for (let i = 0; i < times; i++) {
      btn.click(); // intentionally no await
    }
    await this.page.waitForLoadState('networkidle');
  }

  async isSuccessVisible(): Promise<boolean> {
    try {
      await expect(this.page.locator('h1:has-text("Transfer Complete"), .title:has-text("Transfer Complete")')).toBeVisible();
      return true;
    } catch {
      return false;
    }
  }

  async getSuccessMessage(): Promise<string> {
    return await this.page.locator('h1:has-text("Transfer Complete")').textContent() ?? '';
  }

  // Returns text of first paragraph under the success heading — contains amount + account IDs
  async getConfirmationText(): Promise<string> {
    return await this.page.locator('#showResult p').first().textContent() ?? '';
  }
}
