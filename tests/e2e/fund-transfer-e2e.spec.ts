import { test, expect } from '../../fixtures/base.fixture'
import { config } from '../../config/env.config'

test.describe('@e2e - Fund Transfer End-to-End', () => {
  test('TC-E2E-01: UI transfer reflects in API balance', async ({ page, transferPage, accountPair, api }) => {
    const fromPre = (await api('GET', `${config.apiBase}/accounts/${accountPair.fromAccountId}`)).body as any
    const toPre = (await api('GET', `${config.apiBase}/accounts/${accountPair.toAccountId}`)).body as any
    
    await transferPage.navigate()
    await transferPage.selectFromAccount(accountPair.fromAccountId)
    await transferPage.selectToAccount(accountPair.toAccountId)
    await transferPage.setAmount('100')
    await transferPage.clickTransfer()
    
    const success = await transferPage.isSuccessVisible()
    expect(success).toBe(true)
    
    const fromPost = (await api('GET', `${config.apiBase}/accounts/${accountPair.fromAccountId}`)).body as any
    const toPost = (await api('GET', `${config.apiBase}/accounts/${accountPair.toAccountId}`)).body as any
    
    expect(Math.abs((fromPre.balance - fromPost.balance) - 100)).toBeLessThan(0.01)
    expect(Math.abs((toPost.balance - toPre.balance) - 100)).toBeLessThan(0.01)
  })

  test('TC-E2E-02: Sequential transfers compound correctly', async ({ transferPage, accountPair, api }) => {
    const fromPre = (await api('GET', `${config.apiBase}/accounts/${accountPair.fromAccountId}`)).body as any
    const toPre = (await api('GET', `${config.apiBase}/accounts/${accountPair.toAccountId}`)).body as any
    
    // First transfer: $50
    await transferPage.navigate()
    await transferPage.selectFromAccount(accountPair.fromAccountId)
    await transferPage.selectToAccount(accountPair.toAccountId)
    await transferPage.setAmount('50')
    await transferPage.clickTransfer()
    expect(await transferPage.isSuccessVisible()).toBe(true)
    
    const fromMid = (await api('GET', `${config.apiBase}/accounts/${accountPair.fromAccountId}`)).body as any
    const toMid = (await api('GET', `${config.apiBase}/accounts/${accountPair.toAccountId}`)).body as any
    
    expect(Math.abs((fromPre.balance - fromMid.balance) - 50)).toBeLessThan(0.01)
    expect(Math.abs((toMid.balance - toPre.balance) - 50)).toBeLessThan(0.01)
    
    // Second transfer: $75
    await transferPage.navigate()
    await transferPage.selectFromAccount(accountPair.fromAccountId)
    await transferPage.selectToAccount(accountPair.toAccountId)
    await transferPage.setAmount('75')
    await transferPage.clickTransfer()
    expect(await transferPage.isSuccessVisible()).toBe(true)
    
    const fromPost = (await api('GET', `${config.apiBase}/accounts/${accountPair.fromAccountId}`)).body as any
    const toPost = (await api('GET', `${config.apiBase}/accounts/${accountPair.toAccountId}`)).body as any
    
    expect(Math.abs((fromPre.balance - fromPost.balance) - 125)).toBeLessThan(0.01)
    expect(Math.abs((toPost.balance - toPre.balance) - 125)).toBeLessThan(0.01)
  })

  test('TC-E2E-03: Concurrent clicks transfer only once', async ({ transferPage, accountPair, api }) => {
    test.fail(true, 'DEF-004: ParaBank has no double-submit guard — multiple rapid clicks each trigger independent transfers');
    const fromPre = (await api('GET', `${config.apiBase}/accounts/${accountPair.fromAccountId}`)).body as any
    const toPre = (await api('GET', `${config.apiBase}/accounts/${accountPair.toAccountId}`)).body as any
    
    await transferPage.navigate()
    await transferPage.selectFromAccount(accountPair.fromAccountId)
    await transferPage.selectToAccount(accountPair.toAccountId)
    await transferPage.setAmount('10')
    await transferPage.multiClickTransfer(3)
    
    const fromPost = (await api('GET', `${config.apiBase}/accounts/${accountPair.fromAccountId}`)).body as any
    const toPost = (await api('GET', `${config.apiBase}/accounts/${accountPair.toAccountId}`)).body as any
    
    const fromDelta = fromPre.balance - fromPost.balance
    const toDelta = toPost.balance - toPre.balance
    
    expect(Math.abs(fromDelta - 10)).toBeLessThan(0.01)
    expect(Math.abs(toDelta - 10)).toBeLessThan(0.01)
  })
})
