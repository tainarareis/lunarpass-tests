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
})

test('não deve autenticar com senha incorreta', async ({ page }) => {

    // Arrange - preparação do cenário
    await page.goto('http://localhost:3000/mission-control/login')

    const title = page.getByRole('heading', { name: 'Mission Control' })
    await expect(title).toBeVisible()

    // Act - Execução da ação
    await page.getByLabel('E-mail').fill('buzz@lunarpass.dev')
    await page.getByLabel('Senha').fill('abc123')
    await page.getByRole('button', { name: 'Entrar' }).click()

    // Assert - verificar o resultado
    const alert = page.getByRole('alert')
    await expect(alert).toHaveText('E-mail ou senha inválidos.')
})

test('não deve autenticar com email não cadastrado', async ({ page }) => {

    // Arrange - preparação do cenário
    await page.goto('http://localhost:3000/mission-control/login')

    const title = page.getByRole('heading', { name: 'Mission Control' })
    await expect(title).toBeVisible()

    // Act - Execução da ação
    await page.getByLabel('E-mail').fill('404@lunarpass.dev')
    await page.getByLabel('Senha').fill('pwd123')
    await page.getByRole('button', { name: 'Entrar' }).click()

    // Assert - verificar o resultado
    const alert = page.getByRole('alert')
    await expect(alert).toHaveText('E-mail ou senha inválidos.')
})