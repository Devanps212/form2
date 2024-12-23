import { expect, Page } from '@playwright/test'
import { FORM_HEADER_SELECTORS } from '../constants/selectors/index'

export default class UserLogin{
    constructor(
        private page: Page
    ){}

    loginUser = async()=>{
        await this.page.getByRole('button', { name: 'Login as Oliver' }).click()
        await this.page.getByRole('button', { name: 'avatar-Oliver Smith' }).click()
        await expect(this.page.getByTestId(FORM_HEADER_SELECTORS.header)).toBeVisible()
    }
}