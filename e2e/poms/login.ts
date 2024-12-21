import { expect, Page } from '@playwright/test'

export default class UserLogin{
    constructor(
        private page: Page
    ){}

    loginUser = async()=>{
        await this.page.getByRole('button', { name: 'Login as Oliver' }).click()
        await this.page.getByRole('button', { name: 'avatar-Oliver Smith' }).click()
        await expect(this.page.getByTestId('neeto-molecules-header')).toBeVisible()
    }
}