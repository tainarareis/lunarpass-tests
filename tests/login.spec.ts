import { test, expect } from '@playwright/test'

test('deve autenticar no control de missões', async ({ page }) => {
  await page.goto('http://localhost:3000/mission-control/login')

  // Checkpoint
  const title = page.getByRole('heading', { name: 'Mission Control' })
  await expect(title).toBeVisible()

  await page.getByLabel('E-mail').fill('buzz@lunarpass.dev')
  await page.getByLabel('Senha').fill('pwd123')
  await page.getByRole('button', { name: 'Entrar' }).click()

  const logoutButton = page.getByRole('button', { name: 'Sair' })
  await expect(logoutButton).toBeVisible()
    await page.waitForTimeout(20000) // Adiciona um atraso de 2 segundos
})