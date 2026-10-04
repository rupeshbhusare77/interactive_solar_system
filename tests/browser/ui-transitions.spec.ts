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
test('menus fade when dismissed and respect reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./');
  const trigger = page.getByRole('button', { name: 'Visual layers', exact: true });
  await trigger.click();
  const menu = page.getByRole('group', { name: 'Visual layers', exact: true });
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCSS('opacity', '1');
  const opacity = await menu.evaluate(async element => {
    document.querySelector<HTMLButtonElement>('[aria-label="Visual layers"][aria-expanded]')!.click();
    await Promise.resolve();
    getComputedStyle(element).opacity;
    const fade = element.getAnimations().find(animation => (animation as CSSTransition).transitionProperty === 'opacity');
    if (!fade) return null;
    fade.pause();
    fade.currentTime = Number(fade.effect!.getTiming().duration) / 2;
    const value = Number(getComputedStyle(element).opacity);
    fade.finish();
    return value;
  });
  expect(opacity).toBeGreaterThan(0);
  expect(opacity).toBeLessThan(1);
  await expect(page.locator('.header-layers-popup')).toHaveJSProperty('inert', true);
  await expect(page.locator('.header-layers-popup')).toBeHidden();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await trigger.click();
  expect(await menu.evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s');
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('touch categories stay reachable on phones and landscape screens', async ({ page }) => {
  await page.goto('./');
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 667, height: 375 }, { width: 844, height: 390 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(viewport);
    const dock = page.getByRole('complementary', { name: 'Quick body navigation' });
    await expect(dock.getByRole('button', { name: 'Moons', exact: true })).toBeInViewport();
    await dock.getByRole('button', { name: 'Moons', exact: true }).click();
    const moon = dock.getByRole('button', { name: 'Focus Moon', exact: true });
    await expect(moon).toBeInViewport();
    if (viewport.width < 768) {
      const button = (await moon.boundingBox())!;
      const list = (await dock.locator('.dock-body-list').boundingBox())!;
      expect(button.height).toBeGreaterThanOrEqual(44);
      expect(button.y + button.height).toBeLessThanOrEqual(list.y + list.height + 1);
    }
    await expect(dock.getByRole('button', { name: 'Comets', exact: true })).toBeInViewport();
    await dock.getByRole('button', { name: 'Fleet', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
  }
});