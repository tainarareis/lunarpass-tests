import { Page, Locator, expect } from '@playwright/test'

export class LoginPage {
    readonly page: Page
    readonly alert: Locator

    constructor(page: Page) {
        this.page = page
        this.alert = page.getByRole('alert')
    }

    async go() {
        await this.page.goto('http://localhost:3000/mission-control/login')

        const title = this.page.getByRole('heading', { name: 'Mission Control' })
        await expect(title).toBeVisible()
    }

    async login(email: string, password: string) {
        await this.page.getByLabel('E-mail').fill(email)
        await this.page.getByLabel('Senha').fill(password)
        await this.page.getByRole('button', { name: 'Entrar' }).click()
    }

    async isLoggedUser() {
        const logoutButton = this.page.getByRole('button', { name: 'Sair' })
        await expect(logoutButton).toBeVisible()
    }

}