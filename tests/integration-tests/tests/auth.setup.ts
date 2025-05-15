import { test as setup } from '@playwright/test';
import path from 'path';


const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  
  const BASE_URL = process.env.BASE_URL;
  const EMAIL = process.env.EMAIL;
  // decode the password
  const PWD = Buffer.from(process.env.PASSWORD_BASE64 || '', 'base64').toString('utf-8');
  if (!BASE_URL || !EMAIL || !PWD) {
    throw new Error('BASE_URL, EMAIL or PWD is not set');
  }
  await page.goto(BASE_URL);
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill(EMAIL);
  await page.getByRole('textbox', { name: 'Email' }).press('Enter');
  if (await page.getByRole('button', { name: 'Continue' }).isVisible()) {
    await page.getByRole('button', { name: 'Continue' }).click();
  }
  await page.getByRole('textbox', { name: 'Enter password' }).click();
  await page.getByRole('textbox', { name: 'Enter password' }).fill(PWD);

  await page.keyboard.press('Enter');

  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  await page.context().storageState({ path: authFile });
});