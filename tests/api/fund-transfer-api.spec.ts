import { test, expect } from '../../fixtures/base.fixture'
import { config } from '../../config/env.config'

test.describe('@api - Fund Transfer API', () => {
  test('TC-API-01: Transfer reduces source account balance', async ({ accountPair, api }) => {
    const fromBalanceBefore = (await api('GET', `${config.apiBase}/accounts/${accountPair.fromAccountId}`)).body as any
    const beforeBalance = fromBalanceBefore.balance
    
    await api('POST', `${config.apiBase}/transfer?fromAccountId=${accountPair.fromAccountId}&toAccountId=${accountPair.toAccountId}&amount=20`)
    
    const fromBalanceAfter = (await api('GET', `${config.apiBase}/accounts/${accountPair.fromAccountId}`)).body as any
    const afterBalance = fromBalanceAfter.balance
    
    const reduction = beforeBalance - afterBalance
    expect(Math.abs(reduction - 20)).toBeLessThan(0.01)
  })

  test('TC-API-02: Transfer increases destination account balance', async ({ accountPair, api }) => {
    const toBalanceBefore = (await api('GET', `${config.apiBase}/accounts/${accountPair.toAccountId}`)).body as any
    const beforeBalance = toBalanceBefore.balance
    
    await api('POST', `${config.apiBase}/transfer?fromAccountId=${accountPair.fromAccountId}&toAccountId=${accountPair.toAccountId}&amount=20`)
    
    const toBalanceAfter = (await api('GET', `${config.apiBase}/accounts/${accountPair.toAccountId}`)).body as any
    const afterBalance = toBalanceAfter.balance
    
    const increase = afterBalance - beforeBalance
    expect(Math.abs(increase - 20)).toBeLessThan(0.01)
  })

  test('TC-API-03: Both accounts delta validation', async ({ accountPair, api }) => {
    const fromBefore = (await api('GET', `${config.apiBase}/accounts/${accountPair.fromAccountId}`)).body as any
    const toBefore = (await api('GET', `${config.apiBase}/accounts/${accountPair.toAccountId}`)).body as any
    
    await api('POST', `${config.apiBase}/transfer?fromAccountId=${accountPair.fromAccountId}&toAccountId=${accountPair.toAccountId}&amount=20`)
    
    const fromAfter = (await api('GET', `${config.apiBase}/accounts/${accountPair.fromAccountId}`)).body as any
    const toAfter = (await api('GET', `${config.apiBase}/accounts/${accountPair.toAccountId}`)).body as any
    
    const fromDelta = fromBefore.balance - fromAfter.balance
    const toDelta = toAfter.balance - toBefore.balance
    
    expect(Math.abs(fromDelta - 20)).toBeLessThan(0.01)
    expect(Math.abs(toDelta - 20)).toBeLessThan(0.01)
  })

  test('TC-API-04: Account endpoint returns valid balance', async ({ accountPair, api }) => {
    const res = await api('GET', `${config.apiBase}/accounts/${accountPair.fromAccountId}`)
    const body = res.body as any
    
    expect(res.status).toBe(200)
    expect(typeof body.balance).toBe('number')
    expect(Number.isFinite(body.balance)).toBe(true)
  })

  test('TC-API-05: Customer accounts endpoint lists all accounts', async ({ accountPair, api }) => {
    const res = await api('GET', `${config.apiBase}/customers/${accountPair.customerId}/accounts`)
    const body = res.body as any
    
    expect(res.status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
    
    const accountIds = body.map((acc: any) => acc.id?.toString())
    expect(accountIds).toContain(accountPair.fromAccountId)
    expect(accountIds).toContain(accountPair.toAccountId)
  })

  test('TC-API-06: Overdraft allowed (DEF-001)', async ({ accountPair, api }) => {
    test.fail(true, 'DEF-001: overdraft allowed')
    
    const fromBefore = (await api('GET', `${config.apiBase}/accounts/${accountPair.fromAccountId}`)).body as any
    const toBefore = (await api('GET', `${config.apiBase}/accounts/${accountPair.toAccountId}`)).body as any
    
    await api('POST', `${config.apiBase}/transfer?fromAccountId=${accountPair.fromAccountId}&toAccountId=${accountPair.toAccountId}&amount=999999`)
    
    const fromAfter = (await api('GET', `${config.apiBase}/accounts/${accountPair.fromAccountId}`)).body as any
    const toAfter = (await api('GET', `${config.apiBase}/accounts/${accountPair.toAccountId}`)).body as any
    
    expect(Math.abs(fromAfter.balance - fromBefore.balance)).toBeLessThan(0.01)
    expect(Math.abs(toAfter.balance - toBefore.balance)).toBeLessThan(0.01)
  })
})
