# Parabank Playwright

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-brightgreen)](https://nodejs.org/) [![Playwright](https://img.shields.io/badge/Playwright-Test-blue.svg)](https://playwright.dev/)

A TypeScript-based Playwright test suite for the Parabank application. This project includes UI, API, end-to-end, and performance tests, plus report generation for HTML, Allure, and custom failure analysis.

## Prerequisites

- Node.js 18+ and npm
- Git
- A modern browser installed (Playwright can install browsers automatically)
- Optional: Visual Studio Code or another editor for TypeScript development

## Installation

1. Open a terminal in the project root. If you are not already in the folder, change into it using a relative or generic path:

```bash
cd path/to/parabank-playwright
```

2. Install dependencies:

```bash
npm install
```

3. Install Playwright browsers:

```bash
npx playwright install
```

4. Copy the example environment file:

```bash
cp .env.example .env
```

5. Edit `.env` only if you need to override defaults.

## Usage

Run the default Playwright test suite:

```bash
npm test
```

Run specific test groups:

```bash
npm run test:ui
npm run test:api
npm run test:e2e
npm run test:perf
npm run test:smoke
npm run test:regression
```

Generate and open the Allure report:

```bash
npm run report:allure
```

Run the custom failure analysis report generator:

```bash
npm run analyze
```

## Configuration

Create a local `.env` file from the example and update values only when needed:

```bash
cp .env.example .env
```

The project supports these variables:

- `BASE_URL` — base web application URL for UI tests.
- `API_BASE` — base API endpoint for service calls.
- `PASSWORD` — default password used for generated test users.
- `CUSTOMER_ID` — optional customer ID override.

If `.env` is missing, defaults from `config/env.config.ts` are used.

## Project Structure

- `global-setup.ts` — prepares test state before Playwright runs, including test users, storage state, and accounts.
- `global-teardown.ts` — runs the failure analyzer after tests complete.
- `playwright.config.ts` — Playwright configuration, reporter setup, project definitions, and browser settings.
- `tsconfig.json` — TypeScript compiler settings.
- `package.json` — npm scripts and development dependencies.

Main directories:

- `tests/`
  - `ui/` — browser-based UI tests.
  - `api/` — API test coverage for Parabank services.
  - `e2e/` — end-to-end cross-flow test cases.
  - `performance-lite/` — lightweight performance or stability test scenarios.
- `pages/` — page object classes managing UI selectors and interactions.
- `fixtures/` — shared Playwright fixtures and test setup helpers.
- `config/` — environment configuration values loaded from `.env`.
- `utils/` — utilities including logging, failure analysis, and test data generation.

## Technologies Used

- Playwright Test
- TypeScript
- Allure Playwright
- Allure Commandline
- ts-node
- dotenv

## Reports and Logs

- `playwright-report/` — built-in Playwright HTML report output.
- `allure-report/` — generated Allure report output.
- `allure-results/` — raw Allure test result files.
- `reports/` — custom JSON results and generated `failure-analysis.html` report.
- `logs/` — optional log output directory if the project or test framework writes logs here.

### Viewing Reports

After test execution:

- Open the Playwright report from `playwright-report/index.html`.
- Run `npm run report:allure` to generate and open the Allure report.
- Open `reports/failure-analysis.html` in a browser to review custom failure summaries.

## Environment Variables

The project can be customized using environment variables.

- `BASE_URL` — base web application URL for UI tests.
- `API_BASE` — base API endpoint for service calls.
- `PASSWORD` — default password used for generated test users.
- `CUSTOMER_ID` — optional customer ID override.

If no `.env` file is present, defaults from `config/env.config.ts` are used.

## License

This project is licensed under the MIT License. See `LICENSE` for details.

## Notes

- `global-setup.ts` creates authentication state and account data for worker sessions under `.auth/`.
    User credentials are generated dynamically using `process.hrtime.bigint()` ticks, so each parallel worker gets a unique username and avoids shared-account concurrency issues during banking transactions.
- Playwright is configured to keep screenshots and video only on test failure.
- The repo includes report directories that may be generated during test runs; they are marked as generated content in `.gitattributes`.

