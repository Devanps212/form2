import { Browser, chromium, expect, Page } from "@playwright/test";
import { test } from "../fixture";
import { FORM_INPUT_SELECTORS } from "../constants/selectors";
import { FORM_LABELS } from "../constants/texts";
import UserForm from "../poms/form";


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
        
        await test.step("Step 1: publish a form and check password validation", async()=>{
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

            const newContext = await browser.newContext({ storageState: undefined })
            const incognito = await newContext.newPage()
            await incognito.goto(copiedLink)

            await expect(incognito.locator('[data-cy="password-protected-heading"]')).toBeVisible()

            await incognito.locator('input[data-cy="password-text-field"]').fill("sample123")
            await incognito.locator('button', { hasText: 'Submit' }).click()

            await expect(incognito.locator('[data-cy="welcome-screen-group"]')).toBeVisible()
            await incognito.locator('input[data-cy="email-text-field"]').fill("sample@gmail.com")

            await incognito.getByRole('button', {name: 'Submit'}).click()

            await expect(
                incognito.locator('div')
                .filter({ hasText: "🎉Thank You.Your response has" })
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

    test("should ensure unique submission of form", async({page, form}:{page:Page, form: UserForm})=>{
        
        await test.step("Step 1:Publish a form", async()=>{
            await page.getByTestId('publish-button').click()
            await page.getByRole('link', { name: 'Settings' }).click()
            await page.getByRole('link', { 
                name: 'Prevent duplicate submissions Ensure that each submission is by a unique' 
            }).click()

            await page.getByLabel('Use cookies').click()
            const submit = page.locator('[data-test-id="save-changes-button"]')

            await submit.scrollIntoViewIfNeeded()
            await submit.click()
            await page.waitForTimeout(1000)

        })

        let inCognitURL: string | undefined
        await test.step("Step 2:Submit the form with a email", async()=>{
            inCognitURL = await form.formSubmission({
                repeat: 2,
                cookies: true
            })
        })

        await test.step("Step 3: Incognito Mode Check", async()=>{
            await form.formSubmission({
                incognito:inCognitURL,
                repeat: 1
                
            })
        })

        await test.step("Step 4: Choose No Check option and submit", async()=>{
          await page.getByLabel('No checkResubmissions are').click()
          const submit = page.locator('[data-test-id="save-changes-button"]')
          await submit.scrollIntoViewIfNeeded()
          await submit.click()
          await page.waitForTimeout(1000) 
          await form.formSubmission({
            cookies:false,
            repeat: 2
          })
        })
    })

    test.only("Verify Email field visibility based on Single Choice selection and with logic disabled", async({
        page,
        form
    }:{
        page: Page,
        form: UserForm
    })=>{
        await test.step("Step 1:Add inputs", async()=>{
            await page.getByRole('button', { name: 'Single choice' }).click()
            await page.getByPlaceholder('Question').fill("Interested in Playwright ?")
            
            await expect(page.getByText('OptionsAdd optionAdd bulk')).toBeVisible()
            await page.getByTestId('input-option-2').hover()
            await page.getByTestId('delete-option-button-2').click()
            await page.getByTestId('input-option-2').hover()
            await page.getByTestId('delete-option-button-2').click()

            await page.getByTestId('input-option-0').fill("Yes")
            await page.getByTestId('input-option-1').fill("No")

            await page.getByRole('button', { name: 'Summary' }).click()
            const email = page.getByRole('button', { name: 'Email address' })
            const singleChoice = page.getByRole('button', { name: 'Interested in Playwright ?' })

            await email.dragTo(singleChoice)

        })
        await test.step("Step 2: Setup conditional logic", async()=>{
            await page.getByRole('link', { name: 'Settings' }).click()
            await page.getByRole('link', { name: 'Conditional Logic Add' }).click()

            await page.getByTestId('neeto-molecules-header')
            .getByRole('link', { name: 'Add new condition' }).click()

            await page.locator('div').filter({ hasText: /^Select a field$/ }).first().click()
            await page.getByTestId('menu-list').getByText('Interested in Playwright ?').click({timeout:50000})
            await page.locator('div').filter({ hasText: /^Select a verb$/ }).first().click()
            await page.getByText('contains', { exact: true }).click()
            await page.locator('div').filter({ hasText: /^Select an option$/ }).first().click()
            await page.getByTestId('menu-list').getByText('Yes').click()

            await page.locator('div').filter({ hasText: /^Select an action type$/ }).first().click()
            await page.locator('#react-select-4-option-0').click()

            await page.locator('div').filter({ hasText: /^Select a field$/ }).first().click()
            await page.getByTestId('menu-list').getByText('Email address').click()

            const submit  = page.locator('[data-test-id="save-changes-button"]')
            await submit.scrollIntoViewIfNeeded()
            await submit.click()

            await expect(page.getByRole('button', {
                 name: 'Condition 1 If  Interested in' 
                })).toBeVisible()
                await page.getByTestId('publish-button').click()
        })

        await test.step("Step 3: Check the conditonal logic working (No)", async()=>{
            await form.conditionalCheck({conditionCase:'No'})
        })

        await test.step("Step 4: Check the conditonal logic working (Yes)", async()=>{
            await form.conditionalCheck({conditionCase:'Yes'})
        })

        await test.step("Step 5:Disable the conditional logic", async()=>{
            await page.getByRole('button', {
                 name: 'Condition 1 If  Interested in' 
                }).getByRole('button').click()
            await page.getByRole('button', { name: 'Disable' }).click()
            await form.conditionalCheck({conditionCase:'All'})
        })
    })
})