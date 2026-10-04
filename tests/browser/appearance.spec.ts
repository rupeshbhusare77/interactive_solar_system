import { test, expect } from '@playwright/test';

for (const colorScheme of ['light', 'dark'] as const) {
  test(`${colorScheme} appearance preserves panels and accessible controls`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('./');
    await page.getByRole('button', { name: 'Reset date to now', exact: true }).click();
    await page.getByRole('button', { name: 'Focus Earth', exact: true }).click();
    const inspector = page.getByRole('complementary', { name: 'Earth information' });
    await expect(inspector).toBeVisible();
    expect(await inspector.evaluate(element => getComputedStyle(element).color))
      .toBe(colorScheme === 'light' ? 'rgb(29, 29, 31)' : 'rgb(245, 245, 247)');
    expect(await inspector.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
    const search = page.getByRole('combobox', { name: 'Search celestial bodies' });
    await search.focus();
    expect(await search.evaluate(element => getComputedStyle(element).outlineStyle)).toBe('solid');
    for (const name of ['Telemetry', 'Physical', 'Orbit & Science', 'Overview']) {
      await page.getByRole('tab', { name, exact: true }).click();
      await expect(page.getByRole('tab', { name, exact: true })).toHaveAttribute('aria-selected', 'true');
    }
    await page.screenshot({ path: testInfo.outputPath(`${colorScheme}-inspector.png`) });
    await page.getByRole('button', { name: 'Measure distance', exact: true }).click();
    await expect(page.getByLabel('Distance measurement', { exact: true })).toBeVisible();
    const presetsFit = await page.locator('.measurement-panel .overflow-x-auto > button').evaluateAll(buttons =>
      buttons.every(button => button.scrollWidth <= button.clientWidth)
    );
    expect(presetsFit).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`${colorScheme}-measurement.png`) });
    await page.getByRole('button', { name: 'Open astronomical guide and controls' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`${colorScheme}-guide.png`) });
  });
}
