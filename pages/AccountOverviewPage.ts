import { Page } from '@playwright/test'

export class AccountOverviewPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/parabank/overview.htm');
  }

  // Returns balance of a specific account by ID from the overview table
  async getAccountBalance(accountId: string): Promise<number> {
    const row = this.page.locator(`a[href*="activity.htm?id=${accountId}"]`).locator('../..');
    const balanceText = await row.locator('td:nth-child(2)').textContent() ?? '0';
    return parseFloat(balanceText.replace(/[$,]/g, ''));
  }
}
