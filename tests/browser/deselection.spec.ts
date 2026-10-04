import { test, expect } from '@playwright/test';

test('belts start enabled and remain toggleable', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Visual layers', exact: true }).click();
  for (const name of ['Asteroid belt', 'Kuiper belt']) {
    const toggle = page.getByRole('button', { name, exact: true });
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  }
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`deselect preserves the view and explicit reset restores overview at ${viewport.width}`, async ({ page }) => {
    await page.addInitScript(() => {
      document.addEventListener('camera-motion', event => {
        Object.assign(window, { cameraPose: (event as CustomEvent).detail });
      });
    });
    await page.setViewportSize(viewport);
    await page.goto('./?cameraDiagnostics=1');
    await page.getByRole('button', { name: 'Reset date to now', exact: true }).click();
    await page.getByRole('button', { name: 'Focus Earth', exact: true }).click();
    const canvas = page.locator('canvas');
    await expect.poll(async () => Number(await canvas.getAttribute('data-camera-distance')), { timeout: 45000 }).toBeLessThan(80);
    await expect(canvas).toHaveAttribute('data-camera-state', 'idle', { timeout: 45000 });
    const before = await page.evaluate(() => (window as unknown as { cameraPose: { position: number[]; target: number[]; projection: number[] } }).cameraPose);
    const header = (await page.locator('.app-header').boundingBox())!;
    await page.mouse.click(viewport.width * .55, header.y + header.height + 10);
    await expect(page.getByRole('complementary', { name: 'Earth information' })).toBeHidden();
    await expect(canvas).toHaveAttribute('data-camera-state', 'idle', { timeout: 45000 });
    const after = await page.evaluate(() => (window as unknown as { cameraPose: typeof before }).cameraPose);
    for (const key of ['position', 'target', 'projection'] as const) {
      expect(Math.hypot(...after[key].map((value, index) => value - before[key][index]))).toBeLessThan(.0001);
    }
    await page.getByRole('button', { name: 'Reset camera to free overview', exact: true }).click();
    await expect.poll(async () => page.evaluate(() => {
      const pose = (window as unknown as { cameraPose: { position: number[] } }).cameraPose;
      return Math.hypot(pose.position[0], pose.position[1] - 85, pose.position[2] - 120);
    }), { timeout: 45000 }).toBeLessThan(.0001);
    expect(await page.evaluate(() => (window as unknown as { cameraPose: { projection: number[] } }).cameraPose.projection)).toEqual([0, 0]);
  });
}