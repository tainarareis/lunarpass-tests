import { test, expect } from '@playwright/test'

import { LoginPage } from '../pages/login.page'

let loginPage: LoginPage

test.beforeEach(async ({page}) => {
  loginPage = new LoginPage(page)

  // Arrange - preparação do cenário
  await loginPage.go()
})

test('deve autenticar no controle de missões', async ({ page }) => {
  // Act - Execução da ação
  await loginPage.login('buzz@lunarpass.dev', 'pwd123')

  // Assert - verificar o resultado
  await loginPage.isLoggedUser()
})

test('não deve autenticar com senha incorreta', async ({ page }) => {
  // Act - Execução da ação
  await loginPage.login('buzz@lunarpass.dev', 'abc123')

  // Assert - verificar o resultado
  await expect(loginPage.alert).toHaveText('E-mail ou senha inválidos.')
})

test('não deve autenticar com email não cadastrado', async ({ page }) => {
  // Act - Execução da ação
  await loginPage.login('404@lunarpass.dev', 'pwd123')

  // Assert - verificar o resultado
  await expect(loginPage.alert).toHaveText('E-mail ou senha inválidos.')
})

test('não deve autenticar quando a senha não é informada', async ({ page }) => {
  // Act - Execução da ação
  await loginPage.login('404@lunarpass.dev', '')

  // Assert - verificar o resultado
  await expect(loginPage.alert).toHaveText('Informe a senha')
})

test('não deve autenticar quando o email não é informado', async ({ page }) => {
  // Act - Execução da ação
  await loginPage.login('', 'pwd123')

  // Assert - verificar o resultado
  await expect(loginPage.alert).toHaveText('Informe um e-mail válido')
})

test('não deve autenticar quando não informo email e nem senha', async ({ page }) => {
  // Act - Execução da ação
  await loginPage.login('', '')

  // Assert - verificar o resultado
  await expect(loginPage.alert).toHaveText('Informe um e-mail válido')
})