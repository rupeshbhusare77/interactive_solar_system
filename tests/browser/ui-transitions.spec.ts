import { test, expect } from '@playwright/test';

test('information tabs reveal their selected content', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await page.getByRole('button', { name: 'Reset date to now', exact: true }).click();
  await page.getByRole('button', { name: 'Details', exact: true }).click();
  const inspector = page.getByRole('complementary', { name: 'Earth information' });
  for (const name of ['Telemetry', 'Physical', 'Orbit & Science']) {
    await inspector.getByRole('tab', { name, exact: true }).click();
    const body = (await inspector.locator('.panel-body').boundingBox())!;
    const content = (await inspector.locator('.info-tab-content').boundingBox())!;
    expect(content.y).toBeGreaterThanOrEqual(body.y - 2);
    expect(content.y).toBeLessThan(body.y + body.height - 60);
  }
  await inspector.getByRole('tab', { name: 'Overview', exact: true }).click();
  expect(await inspector.locator('.panel-body').evaluate(element => element.scrollTop)).toBe(0);
});
