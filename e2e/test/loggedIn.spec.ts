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

    test("should publish a form and set password for it", async({
        page, 
        browser,
        form
    }:{
        page: Page, 
        browser: Browser
        form: UserForm
    })=>{
        
        await test.step("Step 1: publish a form and check password validation", async()=>{
            await page.getByTestId('publish-button').click()
            await form.configureAndPublish({
                purpose:"Access control Restrict",
                formLabel:"The form is password"
            })
            
        })

        await test.step("Step 2:Copy link and open in in cognito to check password protection", async()=>{
            await form.PasswordProtectedFormSubmission()
        })

        await test.step("Step 3: Verify the response", async()=>{
            await page.getByRole('link', { name: 'Submissions' }).click()
            await expect(page.getByRole('cell', { name: 'sample@gmail.com' })).toBeVisible()
        })
    })

    test("should ensure unique submission of form", async({page, form}:{page:Page, form: UserForm})=>{
        
        await test.step("Step 1:Publish a form", async()=>{
            await page.getByTestId('publish-button').click()
            await form.configureAndPublish({
                purpose:"Prevent duplicate submissions Ensure that each submission is by a unique",
                formLabel:"Use cookies"
            })
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

    test("Verify Email field visibility based on Single Choice selection and with logic disabled", async({
        page,
        form
    }:{
        page: Page,
        form: UserForm
    })=>{
        
        await test.step("Step 1:Add inputs", async()=>{
            await form.addInputsAndSetupQuestion()
        })

        await test.step("Step 2: Setup conditional logic", async()=>{
            await form.configureAndPublish({
                purpose:"Conditional Logic Add",
                formLabel:"Add new condition"
            })
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