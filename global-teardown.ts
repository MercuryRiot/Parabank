import { failureAnalyzer } from './utils/failureAnalyzer';

export default async function globalTeardown() {
  await failureAnalyzer.generateFailureReport();
  console.log('[Teardown] Failure analysis report generated');
}
