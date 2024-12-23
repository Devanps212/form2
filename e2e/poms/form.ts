import { Browser, expect, Page } from "@playwright/test"

interface Submission {
    repeat?: number,
    incognito?: string,
    cookies?: boolean
}

type Condition = 'Yes' | 'No' | 'All'
type Purpose = 
  | "Conditional Logic Add"
  | "Prevent duplicate submissions Ensure that each submission is by a unique"
  | "Access control Restrict"

type FormLabel = 
  | "The form is password"
  | "Use cookies"
  | "Add new condition"


export default class UserForm{
    constructor(
        private page: Page,
        private browser: Browser
    ){}

    //Form submission
    formSubmission = async({
        repeat,
        incognito,
        cookies=false
    }: Submission)=>{

        let incognitoURL: string | undefined
        let newPage : Page
        let i = 1

        if(repeat){
            while(i <= repeat){
                if(incognito){
                    const newContext = await this.browser.newContext({ storageState: undefined })
                    newPage = await newContext.newPage()

                    await newPage.goto(incognito)

                    await expect(
                        newPage.locator('div').filter({
                        hasText: 'Form TitleQuestion 1Email' 
                        }).nth(2)).toBeVisible()
        
                    await newPage.getByRole('textbox').fill("sample@gmail.com")
                    await newPage.getByRole('button', { name: 'Submit' }).click()
                    await expect(
                        newPage.locator('div')
                        .filter({ hasText: "🎉Thank You.Your response has" })
                        .nth(3)
                    ).toBeVisible({ timeout: 60000 })
                    await newPage.close()
                    await newContext.close()
                    return
                }
    
                const pagePromise = this.page.waitForEvent('popup')
                await this.page.getByTestId('publish-preview-button').click()
                newPage = await pagePromise
                if( i == 1){
                    incognitoURL = newPage.url()
                }
                

                if(i == 2 && cookies){
                    await expect(
                        newPage.getByText(
                            'You cannot submit this form right now.It looks like you have already filled out'
                        )
                    ).toBeVisible({ timeout: 60000 })
                    await newPage.close()
                    if(typeof incognitoURL === "string"){
                        return incognitoURL
                    }
                }
                await expect(
                newPage.locator('div').filter({
                hasText: 'Form TitleQuestion 1Email' 
                }).nth(2)).toBeVisible({timeout:50000})

                await newPage.getByRole('textbox').fill("sample@gmail.com")
                await newPage.getByRole('button', { name: 'Submit' }).click()
                await expect(
                    newPage.locator('div')
                    .filter({ hasText: "🎉Thank You.Your response has" })
                    .nth(3)
                ).toBeVisible({ timeout: 60000 })
                await newPage.close()

                i++
            }
        }   
    }

    //Condtional Check
    conditionalCheck = async({
        conditionCase
    }:{
        conditionCase: Condition
    })=>{
        const pagePromise = this.page.waitForEvent('popup')
        await this.page.getByTestId('publish-preview-button').click()
        const page1 = await pagePromise
        await expect(page1.locator('div').filter({
            hasText: 'Form TitleQuestion' 
           }).nth(2)).toBeVisible({timeout:90000})

        if(conditionCase === "Yes"){
            await page1.locator('label').filter({ hasText: conditionCase }).click()
            await page1.getByRole('textbox').fill("sample@gmail.com")
        }else if(conditionCase === "No"){
            await page1.locator('label').filter({ hasText: conditionCase }).click()
        }else{
            await expect(page1.getByText('Question 1Email address*')).toBeVisible({timeout:50000})
            await expect(page1.getByText('Question 1Interested in')).toBeVisible()
            await page1.close()
            return
        }
        await page1.locator('button', { hasText: 'Submit' }).click()
        await expect(page1.locator('div').filter({
            hasText: '🎉Thank You.Your response has' 
           }).nth(3)).toBeVisible()
        await page1.close()
    }

    //Configuring and Publising
    configureAndPublish = async({
        purpose,
        formLabel
    }:{
        purpose: Purpose,
        formLabel: FormLabel
    })=>{
        await this.page.getByRole('link', { name: 'Settings' }).click()
        await this.page.getByRole('link', { name: purpose }).click()
        if(purpose === "Conditional Logic Add"){
            await this.page.getByTestId('neeto-molecules-header')
            .getByRole('link', { name: formLabel }).click()
            
            await this.page.locator('div').filter({ hasText: /^Select a field$/ }).first().click()
            const menulist = this.page.getByTestId('menu-list')
            await menulist.getByText('Interested in Playwright ?').click({timeout:50000})

            await this.page.locator('div').filter({ hasText: /^Select a verb$/ }).first().click()
            await this.page.getByText('contains', { exact: true }).click()
            await this.page.locator('div').filter({ hasText: /^Select an option$/ }).first().click()
            await menulist.getByText('Yes').click()

            await this.page.locator('div').filter({ hasText: /^Select an action type$/ }).first().click()
            await this.page.locator('#react-select-4-option-0').click()
            await this.page.locator('div').filter({ hasText: /^Select a field$/ }).first().click()
            await menulist.getByText('Email address').click()
        }else{
            await this.page.getByLabel(formLabel).click()
        }

        if(purpose === "Access control Restrict"){
            const password = this.page.getByPlaceholder('Enter password')
            await password.fill("123")
            const submit = this.page.locator('[data-test-id="save-changes-button"]')
            await submit.click()
            await expect(this.page.getByText('Password must be at least 4')).toBeVisible()

            await password.fill("sample123")
            await submit.click()
            await this.page.waitForTimeout(3000)
            return
        }
        const submit = this.page.locator('[data-test-id="save-changes-button"]')

        await submit.scrollIntoViewIfNeeded()
        await submit.click()
    }

    PasswordProtectedFormSubmission = async()=>{
        await this.page.getByRole('link', { name: 'Share' }).click()
        await this.page.getByTestId('link-copy-button').click()
        const copiedLink = await this.page.evaluate(() => navigator.clipboard.readText());
        
        const newContext = await this.browser.newContext({ storageState: undefined })
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
    }

    addInputsAndSetupQuestion = async()=>{
        await this.page.getByRole('button', { name: 'Single choice' }).click()
        await this.page.getByPlaceholder('Question').fill("Interested in Playwright ?")
        
        await expect(this.page.getByText('OptionsAdd optionAdd bulk')).toBeVisible()
        await this.page.getByTestId('input-option-2').hover()
        await this.page.getByTestId('delete-option-button-2').click()
        await this.page.getByTestId('input-option-2').hover()
        await this.page.getByTestId('delete-option-button-2').click()

        await this.page.getByTestId('input-option-0').fill("Yes")
        await this.page.getByTestId('input-option-1').fill("No")

        await this.page.getByRole('button', { name: 'Summary' }).click()
        const email = this.page.getByRole('button', { name: 'Email address' })
        const singleChoice = this.page.getByRole('button', { name: 'Interested in Playwright ?' })

        await email.dragTo(singleChoice)
    }
}