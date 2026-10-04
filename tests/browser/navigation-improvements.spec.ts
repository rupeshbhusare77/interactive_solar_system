import { test, expect } from '@playwright/test';

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 667, height: 375 }]) {
  test(`mobile categories and events remain usable at ${viewport.width}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto('./');
    await page.getByRole('button', { name: 'Reset date to now', exact: true }).click();
    await page.getByRole('button', { name: 'Close telemetry panel', exact: true }).click();
    const dock = page.getByRole('complementary', { name: 'Quick body navigation' });
    await dock.getByRole('button', { name: 'Moons', exact: true }).click();
    await dock.getByRole('button', { name: 'Focus Moon', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Moon', exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('moon-navigation.png') });
    await page.getByRole('button', { name: 'Close telemetry panel', exact: true }).click();
    await dock.getByRole('button', { name: 'Comets', exact: true }).click();
    await expect(dock.getByRole('button', { name: /Hale-Bopp/ })).toBeVisible();
    await page.getByRole('button', { name: 'Historic astronomical events', exact: true }).click();
    const popup = page.locator('.timeline-popover:not([hidden])');
    const bounds = (await popup.boundingBox())!;
    const header = (await page.locator('.app-header').boundingBox())!;
    expect(bounds.y).toBeGreaterThanOrEqual(header.y + header.height);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
    const eclipse = popup.getByRole('button', { name: /Total Solar Eclipse 2024/ });
    await eclipse.scrollIntoViewIfNeeded();
    await eclipse.click();
    const viewer = page.getByRole('dialog', { name: 'Total Solar Eclipse 2024' });
    await expect(viewer).toBeVisible();
    await expect(viewer.getByText(/Illustrative/)).toBeVisible();
    await expect(viewer.getByRole('status')).toContainText('Totality');
    await page.screenshot({ path: testInfo.outputPath('solar-eclipse.png') });
    await viewer.getByLabel('Eclipse phase').press('End');
    await expect(viewer.getByRole('status')).toContainText('Before or after');
    await page.keyboard.press('Escape');
    await expect(viewer).not.toBeVisible();
    await page.getByRole('button', { name: 'Historic astronomical events', exact: true }).click();
    await popup.getByRole('button', { name: /Total Lunar Eclipse 2025/ }).first().click();
    await expect(page.getByRole('dialog', { name: /Total Lunar Eclipse 2025/ })).toBeVisible();
  });
}

test('camera flies to selection and keeps manual zoom in follow mode', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const samples: { id: number; progress: number; position: number[]; target: number[]; projection: number[] }[] = [];
    Object.assign(window, { cameraSamples: samples });
    document.addEventListener('camera-motion', event => {
      samples.push((event as CustomEvent).detail);
      if (samples.length > 1024) samples.shift();
    });
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./?cameraDiagnostics=1');
  await page.getByRole('button', { name: 'Reset date to now', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Loading scene assets' })).not.toBeVisible();
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-camera-state', 'idle', { timeout: 45000 });
  const startingDistance = Number(await canvas.getAttribute('data-camera-distance'));
  expect(startingDistance).toBeCloseTo(Math.hypot(85, 120), 1);
  await page.screenshot({ path: testInfo.outputPath('restored-startup.png') });
  const previous = await page.evaluate(() => {
    const samples = (window as unknown as { cameraSamples: { position: number[]; projection: number[] }[] }).cameraSamples;
    const pose = samples[samples.length - 1];
    samples.length = 0;
    return pose;
  });
  const search = page.getByRole('combobox', { name: 'Search celestial bodies' });
  await search.fill('Earth');
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect.poll(() => page.evaluate(() => (window as unknown as { cameraSamples: { progress: number }[] }).cameraSamples.some(sample => sample.progress > 0 && sample.progress < 1)), { timeout: 45000 }).toBe(true);
  await expect(canvas).toHaveAttribute('data-camera-state', 'idle', { timeout: 45000 });
  const samples = await page.evaluate(() => (window as unknown as { cameraSamples: { id: number; progress: number; position: number[]; projection: number[] }[] }).cameraSamples);
  expect(samples.filter(sample => sample.progress > 0 && sample.progress < 1).length).toBeGreaterThanOrEqual(8);
  expect(Math.hypot(...samples[0].position.map((value, index) => value - previous.position[index]))).toBeLessThan(.001);
  expect(samples[0].projection).toEqual(previous.projection);
  const arrived = samples[samples.length - 1];
  expect(Math.hypot(...arrived.position.map((value, index) => value - previous.position[index]))).toBeGreaterThan(10);
  for (let index = 1; index < samples.length; index++) {
    if (samples[index].id === samples[index - 1].id) {
      expect(samples[index].progress - samples[index - 1].progress).toBeLessThanOrEqual(.063);
    }
  }
  await page.getByRole('button', { name: 'Camera tracking mode' }).click();
  await page.getByRole('option', { name: /^Lock & Follow/ }).click();
  await expect(canvas).toHaveAttribute('data-camera-state', 'idle', { timeout: 45000 });
  const beforeZoom = Number(await canvas.getAttribute('data-camera-distance'));
  await page.mouse.move(800, 400);
  await page.mouse.wheel(0, -500);
  await expect.poll(async () => Number(await canvas.getAttribute('data-camera-distance'))).toBeLessThan(beforeZoom * .98);
  await page.waitForTimeout(800);
  expect(Number(await canvas.getAttribute('data-camera-distance'))).toBeLessThan(beforeZoom * .98);
  // Selecting the same body again should refocus after a manual zoom.
  await page.getByRole('button', { name: 'Focus Earth', exact: true }).click();
  await expect.poll(async () => Number(await canvas.getAttribute('data-camera-distance')), { timeout: 45000 }).toBeGreaterThan(beforeZoom * .99);
  await expect(page.getByRole('alert', { name: 'Scene recovery' })).not.toBeVisible();
});

test('eclipse views animate, pause, resume, and distinguish solar and lunar shadows', async ({ page }) => {
  await page.goto('./');
  for (const event of ['Total Solar Eclipse 2024', 'Total Lunar Eclipse 2026', 'Annular Solar Eclipse 2023']) {
    await page.getByRole('button', { name: 'Historic astronomical events', exact: true }).click();
    await page.locator('.timeline-popover:not([hidden])').getByRole('button', { name: new RegExp(event) }).click();
    const viewer = page.getByRole('dialog', { name: event });
    await expect(viewer.getByRole('img', { name: /moving eclipse shadows/ })).toBeVisible();
    await viewer.getByRole('button', { name: 'Observer view', exact: true }).click();
    await expect(viewer.getByRole('img', { name: event.includes('Lunar') ? 'Earth’s shadow passing across the Moon' : 'Moon passing in front of the Sun', exact: true })).toBeVisible();
    await viewer.getByRole('button', { name: 'Restart eclipse', exact: true }).click();
    const phase = viewer.getByLabel('Eclipse phase');
    await expect(phase).toHaveValue('0');
    await viewer.getByRole('button', { name: 'Play eclipse illustration' }).click();
    await expect.poll(async () => Number(await phase.inputValue())).toBeGreaterThan(5);
    await viewer.getByRole('button', { name: 'Pause eclipse illustration' }).click();
    const paused = await phase.inputValue();
    await page.waitForTimeout(200);
    await expect(phase).toHaveValue(paused);
    await viewer.getByRole('button', { name: 'Play eclipse illustration' }).click();
    await expect.poll(async () => Number(await phase.inputValue())).toBeGreaterThan(Number(paused) + 3);
    await viewer.getByRole('button', { name: 'Close eclipse viewer' }).click();
  }
});

test('smooth camera motion can override a reduced-motion system preference', async ({ page }) => {
  await page.addInitScript(() => {
    const steps: number[] = [];
    Object.assign(window, { cameraSteps: steps });
    document.addEventListener('camera-motion', event => steps.push((event as CustomEvent).detail.progress));
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./?cameraDiagnostics=1');
  await page.getByRole('button', { name: 'Reset date to now', exact: true }).click();
  await page.getByRole('button', { name: 'Visual layers', exact: true }).click();
  const motion = page.getByRole('button', { name: 'Smooth camera transitions', exact: true });
  await expect(motion).toHaveAttribute('aria-pressed', 'false');
  await motion.click();
  await expect(motion).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-camera-state', 'idle', { timeout: 45000 });
  await page.evaluate(() => { (window as unknown as { cameraSteps: number[] }).cameraSteps.length = 0; });
  const search = page.getByRole('combobox', { name: 'Search celestial bodies' });
  await search.fill('Moon');
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect.poll(() => page.evaluate(() => (window as unknown as { cameraSteps: number[] }).cameraSteps.some(step => step > 0 && step < 1)), { timeout: 45000 }).toBe(true);
  await expect(canvas).toHaveAttribute('data-camera-state', 'idle', { timeout: 45000 });
});
