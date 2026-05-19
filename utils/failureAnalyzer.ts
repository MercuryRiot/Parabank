import * as fs from 'fs';
import * as path from 'path';

interface TestResultEntry {
  status: 'passed' | 'failed' | 'skipped' | 'timedOut' | 'interrupted';
  duration: number;
  error?: { message?: string };
}

interface TestEntry {
  title: string;
  results: TestResultEntry[];
  status: 'expected' | 'unexpected' | 'skipped';
}

interface SpecEntry {
  title?: string;
  tests: TestEntry[];
}

interface SuiteEntry {
  suites?: SuiteEntry[];
  specs?: SpecEntry[];
}

interface PlaywrightReport {
  suites: SuiteEntry[];
}

function normalizeTitle(title: string | undefined): string {
  return (title ?? '').replace(/\s+/g, ' ').trim();
}

function stripAnsi(str: string): string {
  return str.replace(/\x1B\[[0-9;]*m/g, '');
}

function collectTests(suite: SuiteEntry, tests: TestEntry[]) {
  if (suite.specs) {
    for (const spec of suite.specs) {
      if (spec.tests) {
        for (const t of spec.tests) {
          if (!t.title) (t as any).title = spec.title;
          tests.push(t);
        }
      }
    }
  }
  // Direct tests field (Playwright JSON reporter structure)
  if ((suite as any).tests) {
    tests.push(...(suite as any).tests);
  }
  if (suite.suites) {
    for (const child of suite.suites) {
      collectTests(child, tests);
    }
  }
}

function renderBadge(label: string, count: number, color: string) {
  return `<span style="display:inline-block;padding:0.4rem 0.75rem;margin-right:0.5rem;border-radius:999px;background:${color};color:#fff;font-weight:600;font-family:system-ui, sans-serif;">${label}: ${count}</span>`;
}

function renderBarChart(passed: number, failed: number, skipped: number) {
  const total = Math.max(passed + failed + skipped, 1);
  const passedWidth = Math.round((passed / total) * 100);
  const failedWidth = Math.round((failed / total) * 100);
  const skippedWidth = Math.max(100 - passedWidth - failedWidth, 0);

  return `
    <svg width="100%" height="32" viewBox="0 0 100 10" role="img" aria-label="Pass fail skip chart">
      <rect x="0" y="1" width="${passedWidth}" height="8" fill="#22c55e" />
      <rect x="${passedWidth}" y="1" width="${failedWidth}" height="8" fill="#ef4444" />
      <rect x="${passedWidth + failedWidth}" y="1" width="${skippedWidth}" height="8" fill="#6b7280" />
      <text x="50" y="9.5" text-anchor="middle" fill="#111827" font-size="2.5">Passed ${passed} | Failed ${failed} | Skipped ${skipped}</text>
    </svg>
  `;
}

export const failureAnalyzer = {
  generateFailureReport: async (): Promise<void> => {
    const resultsPath = path.join('reports', 'results.json');
    if (!fs.existsSync(resultsPath)) {
      console.log('[FailureAnalyzer] No results.json found — skipping report');
      return;
    }

    const raw = fs.readFileSync(resultsPath, 'utf-8');
    const report = JSON.parse(raw) as PlaywrightReport;
    const tests: TestEntry[] = [];
    if (report.suites) {
      for (const suite of report.suites) {
        // Guard: only collect from suites that have nested suites/specs
        if (!suite) continue;
        collectTests(suite, tests);
      }
    }
    console.log(`[FailureAnalyzer] Collected ${tests.length} tests`);
    // Debug: print first few test titles and statuses
    console.log('[FailureAnalyzer] Sample tests:', tests.slice(0, 8).map(t => ({ title: t.title, status: (t as any).status })) );

    const failureRows: string[] = [];
    let passedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const test of tests) {
      // Guard: ensure test structure is present
      if (!test) continue;
      const title = normalizeTitle((test as any).title ?? '');
      const testStatus = (test as any).status as string | undefined;
      const lastResult = test.results?.[test.results.length - 1];

      if (testStatus === 'unexpected') {
        failedCount += 1;
        const rawMsg = lastResult?.error?.message ?? 'No error message';
        const errorMessage = stripAnsi(rawMsg).replace(/\n/g, '<br>');
        failureRows.push(`
          <tr>
            <td>${title}</td>
            <td>${errorMessage}</td>
            <td>${(lastResult?.duration ?? 0).toFixed(0)} ms</td>
          </tr>
        `);
      } else if (testStatus === 'expected') {
        passedCount += 1;
      } else if (testStatus === 'skipped') {
        skippedCount += 1;
      } else {
        // Fallback: if status missing, infer from lastResult
        if (lastResult?.status === 'failed' || lastResult?.status === 'timedOut') {
          failedCount += 1;
          const rawMsg = lastResult?.error?.message ?? 'No error message';
          const errorMessage = stripAnsi(rawMsg).replace(/\n/g, '<br>');
          failureRows.push(`
            <tr>
              <td>${title}</td>
              <td>${errorMessage}</td>
              <td>${(lastResult?.duration ?? 0).toFixed(0)} ms</td>
            </tr>
          `);
        } else if (lastResult?.status === 'passed') {
          passedCount += 1;
        } else if (lastResult?.status === 'skipped') {
          skippedCount += 1;
        }
      }
    }

    const totalCount = passedCount + failedCount + skippedCount;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Failure Analysis Report</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; background: #f8fafc; color: #111827; }
    h1 { margin-top: 0; }
    .summary { margin-bottom: 1.5rem; }
    .summary span { font-size: 0.95rem; }
    .chart { margin: 1rem 0; }
    table { width: 100%; border-collapse: collapse; background: #ffffff; }
    th, td { padding: 0.9rem 0.75rem; border-bottom: 1px solid #e5e7eb; text-align: left; }
    th { background: #f3f4f6; font-weight: 700; }
    tr:nth-child(even) { background: #fafafa; }
    .footer { margin-top: 1.5rem; color: #6b7280; font-size: 0.95rem; }
  </style>
</head>
<body>
  <h1>Failure Analysis Report</h1>
  <div class="summary">
    ${renderBadge('Total', totalCount, '#2563eb')}
    ${renderBadge('Passed', passedCount, '#22c55e')}
    ${renderBadge('Failed', failedCount, '#ef4444')}
    ${renderBadge('Skipped', skippedCount, '#6b7280')}
  </div>
  <div class="chart">${renderBarChart(passedCount, failedCount, skippedCount)}</div>
  <h2>Failures</h2>
  <table>
    <thead>
      <tr><th>Test Name</th><th>Error Message</th><th>Duration</th></tr>
    </thead>
    <tbody>
      ${failureRows.join('') || '<tr><td colspan="3">No failures detected</td></tr>'}
    </tbody>
  </table>
  <div class="footer">Generated ${new Date().toISOString()}</div>
</body>
</html>`;

    const outDir = 'reports';
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, 'failure-analysis.html');
    fs.writeFileSync(outFile, html, 'utf-8');
    console.log(`[FailureAnalyzer] Failure report written to ${outFile}`);
  },
};

if (require.main === module) {
  failureAnalyzer.generateFailureReport().catch(console.error);
}
