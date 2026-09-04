import { Page, Locator } from "@playwright/test"

export class Navbar {
  readonly page: Page
//   readonly userMenu: Locator;
  readonly logoutButton: Locator

  constructor(page: Page) {
    this.page = page
    // this.userMenu = page.locator('#user-menu')
    this.logoutButton = page.getByRole('button', { name: 'Sair' })
  }
}