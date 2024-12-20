import { Browser, expect, Page } from "@playwright/test";
import { test } from "../fixture";
import { FORM_INPUT_SELECTORS } from "../constants/selectors";
import { FORM_LABELS } from "../constants/texts";


test.describe("Access Control: Password Protection on Form", ()=>{

    let formName : string

    test.beforeEach("should goto form creation page", async({page}:{page: Page})=>{
        await page.goto('/admin/dashboard/active')
        await page.getByTestId(FORM_INPUT_SELECTORS.header)
        .getByRole('button', { name: FORM_LABELS.addNewForm }).click()
        await page.getByText(FORM_LABELS.startFromScratch).click()
        const form = page.getByTestId(FORM_INPUT_SELECTORS.formName)
        await expect(form).toBeVisible({timeout:50000})
        formName = await form.innerText()
    })

    test("should publish a form and set password for it", async({page, browser}:{page: Page, browser: Browser})=>{
        
        await test.step("Step 1: publish a form", async()=>{
            await page.getByTestId('publish-button').click()
            await page.getByRole('link', { name: 'Settings' }).click()
            await page.getByRole('link', { name: 'Access control Restrict' }).click()

            await page.getByLabel('The form is password').click()
            const password = page.getByPlaceholder('Enter password')
            await password.fill("123")
            await page.locator('[data-test-id="save-changes-button"]').click()
            await expect(page.getByText('Password must be at least 4')).toBeVisible()

            await password.fill("sample123")
            await page.locator('[data-test-id="save-changes-button"]').click()
            await page.waitForTimeout(3000)
            
        })

        await test.step("Step 2:Copy link and open in in cognito to check password protection", async()=>{
            await page.getByRole('link', { name: 'Share' }).click()
            await page.getByTestId('link-copy-button').click()
            const copiedLink = await page.evaluate(() => navigator.clipboard.readText());

            const newContext = await browser.newContext()
            const incognito = await newContext.newPage()
            await incognito.goto(copiedLink)

            await expect(incognito.locator('[data-cy="password-protected-heading"]')).toBeVisible()

            await incognito.locator('input[data-cy="password-text-field"]').fill("sample123")
            await incognito.locator('button', { hasText: 'Submit' }).click()

            await expect(incognito.locator('[data-cy="welcome-screen-group"]')).toBeVisible()
            await incognito.locator('input[data-cy="email-text-field"]').fill("sample@gmail.com")

            await expect(
                incognito.locator('div')
            .   filter({ hasText: "🎉Thank You.Your response has" })
                .nth(3)
            ).toBeVisible({ timeout: 60000 })

            await newContext.close()
            await incognito.close()
        })

        await test.step("Step 3: Verify the response", async()=>{
            await page.getByRole('link', { name: 'Submissions' }).click()
            await expect(page.getByRole('cell', { name: 'sample@gmail.com' })).toBeVisible()
        })
    })
})