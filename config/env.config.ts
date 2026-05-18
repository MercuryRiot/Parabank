export const config = {
  baseUrl: process.env.BASE_URL ?? 'https://parabank.parasoft.com',
  apiBase: process.env.API_BASE ?? 'https://parabank.parasoft.com/parabank/services/bank',
  password: process.env.PASSWORD ?? 'demo1234',
  customerId: process.env.CUSTOMER_ID ?? '',
};
