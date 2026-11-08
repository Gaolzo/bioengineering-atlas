import { expect, test } from '@playwright/test';

test('opens a molecular record from the catalog and preserves it when changing languages', async ({ page }) => {
  await page.goto('/atlas?view=metabolite');
  await expect(page.getByRole('link', { name: 'Moléculas y materiales' })).toHaveAttribute('aria-current', 'page');
  await page.getByLabel('Buscar en el atlas').fill('CID 802');
  await expect(page.getByRole('status')).toContainText('1 resultado');
  await page.getByRole('link', { name: 'Ácido indol-3-acético (IAA)', exact: true }).click();
  await expect(page).toHaveURL(/item=iaa$/);
  await expect(page.getByRole('heading', { name: 'Ácido indol-3-acético (IAA)', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'EN · English' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Indole-3-acetic acid (IAA)', level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: /A Minimal Synthetic IAA Pathway/ })).toHaveAttribute('href', '/biblioteca/iaa-avocado-2026');
});

test('filters coauthors and selects a documented collaboration', async ({ page }) => {
  await page.goto('/colaboraciones');
  await page.getByLabel('Año', { exact: true }).selectOption('2004');
  await page.getByLabel('Buscar coautor').fill('Collado');
  await expect(page.getByRole('status')).toContainText('1 coautor en la selección');
  await expect(page.getByLabel('Coautor seleccionado')).toHaveValue('Julio Collado-Vides');
  await expect(page.getByRole('heading', { name: 'Julio Collado-Vides', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /RegulonDB \(version 4.0\)/ })).toHaveAttribute('href', '/biblioteca/regulondb-4');
  await page.getByLabel('Buscar coautor').fill('Sal');
  await page.getByLabel('Coautor seleccionado').selectOption('Heladia Salgado');
  await expect(page.getByRole('heading', { name: 'Heladia Salgado', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Heladia Salgado · 1' })).toHaveAttribute('aria-pressed', 'true');
});
