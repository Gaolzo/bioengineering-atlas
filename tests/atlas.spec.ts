import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('production routes work at the configured viewport', async ({ page }) => {
  const paths = ['/', '/laboratorio', '/laboratorio?mode=plant', '/laboratorio?mode=process', '/atlas?item=iaa',
    '/biblioteca', '/biblioteca/iaa-avocado-2026', '/cronologia', '/colaboraciones', '/evidencia', '/metodologia'];
  for (const path of paths) {
    const response = await page.goto(path);
    expect(response?.ok()).toBe(true);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
  }
});

test('keeps an interactive selection across language changes and reload', async ({ page }) => {
  await page.goto('/laboratorio?mode=network');
  await page.getByLabel('Tipo de conexión').selectOption('repress');
  await page.getByLabel('Condición representada').selectOption('trp');
  await page.getByRole('button', { name: 'TrpR', exact: true }).click();
  await page.getByRole('button', { name: 'EN · English' }).click();
  await expect(page.getByRole('heading', { name: 'Interactive lab' })).toBeVisible();
  await expect(page.getByLabel('Connection type')).toHaveValue('repress');
  await expect(page.getByRole('button', { name: 'TrpR', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByLabel('Illustrated condition')).toHaveValue('trp');
  await page.getByRole('link', { name: 'Molecular record' }).click();
  await expect(page.getByRole('heading', { name: 'trpR / TrpR' })).toBeVisible();
  await expect(page).toHaveURL(/item=trpr/);
});

test('filters the library, exports citations and opens a primary source', async ({ page }) => {
  await page.goto('/biblioteca');
  await page.getByLabel('Buscar en la biblioteca').fill('10.3390/synbio4020008');
  await expect(page.getByRole('status')).toContainText('1 de');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar selección' }).click();
  expect((await download).suggestedFilename()).toBe('bioengineering-atlas.csv');
  await page.locator('.result h2 a').click();
  await expect(page.getByRole('link', { name: /DOI 10\.3390/ })).toHaveAttribute('href', 'https://doi.org/10.3390/synbio4020008');
  await page.getByRole('link', { name: 'Consultar afirmación y fuente' }).click();
  await expect(page.getByRole('heading', { name: 'Registro de evidencia' })).toBeVisible();
});

test('plant filters keep documented cases and display unmatched combinations', async ({ page }) => {
  await page.goto('/laboratorio?mode=plant');
  await page.getByLabel('Organismo').selectOption('Nicotiana tabacum');
  await expect(page.getByLabel('Elegir visualización')).toHaveValue('iaa-tobacco-explants');
  await page.getByLabel('Molécula').selectOption('L-DOPA');
  await expect(page.getByRole('status')).toContainText('No hay casos documentados');
});

test('runs automated accessibility checks on representative views', async ({ page }) => {
  test.setTimeout(90_000);
  for (const path of ['/', '/laboratorio?mode=network', '/biblioteca', '/atlas?item=iaa', '/colaboraciones']) {
    await page.goto(path);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) })), path).toEqual([]);
  }
});
