import { test, expect } from '@playwright/test';

test('changing simulation dates keeps timeline controls stationary', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Reset date to now', exact: true }).click();

  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const positions: { x: number; y: number; width: number }[] = [];
    for (const date of ['2026-05-01', '2026-09-02', '2026-11-30']) {
      await page.getByRole('button', { name: 'Set simulation date', exact: true }).click();
      await page.locator('#simulation-date').fill(date);
      await page.getByRole('button', { name: 'Apply UTC Date', exact: true }).click();
      await expect(page.locator('.simulation-time')).toHaveAttribute('datetime', `${date}T00:00:00.000Z`);
      const bounds = await page.getByRole('button', { name: 'Step back 30 days', exact: true }).boundingBox();
      positions.push(bounds!);
    }
    for (const position of positions.slice(1)) {
      expect(Math.abs(position.x - positions[0].x)).toBeLessThan(0.5);
      expect(Math.abs(position.y - positions[0].y)).toBeLessThan(0.5);
    }
  }
});
