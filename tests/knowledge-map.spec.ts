import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('follows documented research connections across topic and language changes', async ({ page }) => {
  await page.goto('/mapa?topic=synthetic&study=iaa-avocado-2026');
  await expect(page.getByRole('heading', { name: 'Mapa de investigaciones', level: 1 })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Publicación', exact: true })).toHaveValue('iaa-avocado-2026');
  await expect(page.getByRole('link', { name: 'Escherichia coli', exact: true })).toHaveAttribute('href', '/atlas?item=escherichia-coli');
  await page.getByRole('link', { name: 'Ingeniería metabólica', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Publicación', exact: true })).toHaveValue('iaa-avocado-2026');
  await page.getByRole('button', { name: 'EN · English' }).click();
  await expect(page.getByRole('heading', { name: 'Research map', level: 1 })).toBeVisible();
  await page.getByLabel('Publication', { exact: true }).selectOption('avocado-d-lactate');
  await expect(page).toHaveURL(/study=avocado-d-lactate/);
  await expect(page.getByRole('link', { name: 'D-lactate', exact: true })).toHaveAttribute('href', '/atlas?item=d-lactate');
  await expect(page.getByRole('link', { name: 'Open record', exact: true })).toHaveAttribute('href', '/biblioteca/avocado-d-lactate');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations).toEqual([]);
});
