import { test, expect } from '../../fixtures/base.fixture'
import transfers from '../../test-data/transfers.json'
import { config } from '../../config/env.config'

const findTransfer = (tcId: string) => {
  return transfers.validTransfers.find(t => t.tcId === tcId) || transfers.negativeTransfers.find(t => t.tcId === tcId)
}

test.describe('@smoke @ui - Fund Transfer UI Smoke', () => {
  test('TC-UI-01: Transfer $100', async ({ transferPage, accountPair }) => {
    const tr = findTransfer('TC-UI-01')!
    await transferPage.navigate()
    await transferPage.selectFromAccount(accountPair.fromAccountId)
    await transferPage.selectToAccount(accountPair.toAccountId)
    await transferPage.setAmount(tr.amount)
    await transferPage.clickTransfer()
    const success = await transferPage.isSuccessVisible()
    expect(success).toBe(true)
  })

  test('TC-UI-02: Transfer $0.01 (minimum valid)', async ({ transferPage, accountPair }) => {
    const tr = findTransfer('TC-UI-02')!
    await transferPage.navigate()
    await transferPage.selectFromAccount(accountPair.fromAccountId)
    await transferPage.selectToAccount(accountPair.toAccountId)
    await transferPage.setAmount(tr.amount)
    await transferPage.clickTransfer()
    const success = await transferPage.isSuccessVisible()
    expect(success).toBe(true)
  })

  test('TC-UI-04: Transfer $50, verify success message', async ({ transferPage, accountPair }) => {
    const tr = findTransfer('TC-UI-04')!
    await transferPage.navigate()
    await transferPage.selectFromAccount(accountPair.fromAccountId)
    await transferPage.selectToAccount(accountPair.toAccountId)
    await transferPage.setAmount(tr.amount)
    await transferPage.clickTransfer()
    const message = await transferPage.getSuccessMessage()
    expect(message).toContain('Transfer Complete')
  })
})

test.describe('@regression @ui - Fund Transfer UI Regression', () => {
  test('TC-UI-03: Transfer exact account balance', async ({ transferPage, accountPair }) => {
    await transferPage.navigate()
    await transferPage.selectFromAccount(accountPair.fromAccountId)
    await transferPage.selectToAccount(accountPair.toAccountId)
    await transferPage.setAmount('500')
    await transferPage.clickTransfer()
    
    const success = await transferPage.isSuccessVisible()
    expect(success).toBe(true)
  })

  test('TC-UI-05: Verify confirmation details contain amount and account IDs', async ({ transferPage, accountPair }) => {
    test.fail(true, 'DEF-006: Confirmation paragraph renders blank account ID spans — dynamic values not injected into #showResult p text');
    const tr = findTransfer('TC-UI-05')!
    await transferPage.navigate()
    await transferPage.selectFromAccount(accountPair.fromAccountId)
    await transferPage.selectToAccount(accountPair.toAccountId)
    await transferPage.setAmount(tr.amount)
    await transferPage.clickTransfer()
    
    const confirmation = await transferPage.getConfirmationText()
    expect(confirmation).toContain(tr.amount)
    expect(confirmation).toContain(accountPair.fromAccountId)
    expect(confirmation).toContain(accountPair.toAccountId)
  })

  test('TC-UI-06: Transfer $999999 (insufficient funds)', async ({ transferPage, accountPair }) => {
    const tr = findTransfer('TC-UI-06')!
    await transferPage.navigate()
    await transferPage.selectFromAccount(accountPair.fromAccountId)
    await transferPage.selectToAccount(accountPair.toAccountId)
    await transferPage.setAmount(tr.amount)
    await transferPage.clickTransfer()
    
    const success = await transferPage.isSuccessVisible()
    expect(success).toBe(false)
  })

  test('TC-UI-08: Transfer $0 (zero amount)', async ({ transferPage, accountPair }) => {
    const tr = findTransfer('TC-UI-08')!
    await transferPage.navigate()
    await transferPage.selectFromAccount(accountPair.fromAccountId)
    await transferPage.selectToAccount(accountPair.toAccountId)
    await transferPage.setAmount(tr.amount)
    await transferPage.clickTransfer()
    
    const success = await transferPage.isSuccessVisible()
    expect(success).toBe(false)
  })

  test('TC-UI-09: Transfer -$50 (negative amount)', async ({ transferPage, accountPair }) => {
    const tr = findTransfer('TC-UI-09')!
    await transferPage.navigate()
    await transferPage.selectFromAccount(accountPair.fromAccountId)
    await transferPage.selectToAccount(accountPair.toAccountId)
    await transferPage.setAmount(tr.amount)
    await transferPage.clickTransfer()
    
    const success = await transferPage.isSuccessVisible()
    expect(success).toBe(false)
  })

  test('TC-UI-07: Self-transfer not blocked (DEF-003)', async ({ transferPage, accountPair }) => {
    const tr = findTransfer('TC-UI-07')!
    await transferPage.navigate()
    await transferPage.selectFromAccount(accountPair.fromAccountId)
    await transferPage.selectToAccount(accountPair.fromAccountId) // same account
    await transferPage.setAmount(tr.amount)
    await transferPage.clickTransfer()
    
    const success = await transferPage.isSuccessVisible()
    expect(success).toBe(false)
  })

  test('TC-UI-10: Transfer "abc$$" (non-numeric)', async ({ transferPage, accountPair }) => {
    const tr = findTransfer('TC-UI-10')!
    await transferPage.navigate()
    await transferPage.selectFromAccount(accountPair.fromAccountId)
    await transferPage.selectToAccount(accountPair.toAccountId)
    await transferPage.setAmount(tr.amount)
    await transferPage.clickTransfer()

    const success = await transferPage.isSuccessVisible()
    expect(success).toBe(false)

    // DEF-006: annotate missing inline validation message
    const page = transferPage['page']
    const hasValidationMsg = await page.locator('.error, #error, [class*=\"error\"]').isVisible().catch(() => false)
    if (!hasValidationMsg) {
      test.info().annotations.push({
        type: 'DEF-006',
        description: 'UX defect: transfer blocked correctly but no inline validation message rendered for non-numeric input'
      })
    }
  })
})

