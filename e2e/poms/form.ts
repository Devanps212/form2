import { Browser, expect, Page } from "@playwright/test"
import { FORM_LABELS, SUBMISSION_USER_DETAILS, SUCCESS_MESSAGE } from "../constants/texts"
import { FORM_INPUT_SELECTORS, FORM_PUBLISH_SELECTORS, FORM_HEADER_SELECTORS } from "../constants/selectors"

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
        
                    await newPage.getByRole('textbox').fill(SUBMISSION_USER_DETAILS.email)
                    await newPage.getByRole('button', { name: 'Submit' }).click()
                    await expect(
                        newPage.locator('div')
                        .filter({ hasText: SUCCESS_MESSAGE.responseSuccess })
                        .nth(3)
                    ).toBeVisible({ timeout: 60000 })
                    await newPage.close()
                    await newContext.close()
                    return
                }
    
                const pagePromise = this.page.waitForEvent('popup')
                await this.page.getByTestId(FORM_PUBLISH_SELECTORS.publishPreviewButton).click()
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

                await newPage.getByRole('textbox').fill(SUBMISSION_USER_DETAILS.email)
                await newPage.getByRole('button', { name: 'Submit' }).click()
                await expect(
                    newPage.locator('div')
                    .filter({ hasText: SUCCESS_MESSAGE.responseSuccess })
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
        await this.page.getByTestId(FORM_PUBLISH_SELECTORS.publishPreviewButton).click()
        const page1 = await pagePromise
        await expect(page1.locator('div').filter({
            hasText: 'Form TitleQuestion' 
           }).nth(2)).toBeVisible({timeout:90000})

        if(conditionCase === "Yes"){
            await page1.locator('label').filter({ hasText: conditionCase }).click()
            await page1.getByRole('textbox').fill(SUBMISSION_USER_DETAILS.email)
        }else if(conditionCase === "No"){
            await page1.locator('label').filter({ hasText: conditionCase }).click()
        }else{
            await expect(page1.getByText(FORM_LABELS.email)).toBeVisible({timeout:50000})
            await expect(page1.getByText(FORM_LABELS.question)).toBeVisible()
            await page1.close()
            return
        }
        await page1.locator('button', { hasText: 'Submit' }).click()
        await expect(page1.locator('div').filter({
            hasText: SUCCESS_MESSAGE.responseSuccess 
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
            await this.page.getByTestId(FORM_HEADER_SELECTORS.header)
            .getByRole('link', { name: formLabel }).click()
            
            await this.page.locator('div').filter({ hasText: /^Select a field$/ }).first().click()
            const menulist = this.page.getByTestId(FORM_INPUT_SELECTORS.menuList)
            await menulist.getByText('Interested in Playwright ?').click({timeout:50000})

            await this.page.locator('div').filter({ hasText: /^Select a verb$/ }).first().click()
            await this.page.getByText('contains', { exact: true }).click()
            await this.page.locator('div').filter({ hasText: /^Select an option$/ }).first().click()
            await menulist.getByText('Yes').click()

            await this.page.locator('div').filter({ hasText: /^Select an action type$/ }).first().click()
            await this.page.locator(FORM_INPUT_SELECTORS.optionSelect).click()
            await this.page.locator('div').filter({ hasText: /^Select a field$/ }).first().click()
            await menulist.getByText('Email address').click()
        }else{
            await this.page.getByLabel(formLabel).click()
        }

        if(purpose === "Access control Restrict"){
            const password = this.page.getByPlaceholder('Enter password')
            await password.fill("123")
            const submit = this.page.locator(FORM_INPUT_SELECTORS.saveChanges)
            await submit.click()
            await expect(this.page.getByText('Password must be at least 4')).toBeVisible()

            await password.fill("sample123")
            await submit.click()
            await this.page.waitForTimeout(3000)
            return
        }
        const submit = this.page.locator(FORM_INPUT_SELECTORS.saveChanges)

        await submit.scrollIntoViewIfNeeded()
        await submit.click()
    }

    PasswordProtectedFormSubmission = async()=>{
        await this.page.getByRole('link', { name: 'Share' }).click()
        await this.page.getByTestId(FORM_INPUT_SELECTORS.copyLink).click()
        const copiedLink = await this.page.evaluate(() => navigator.clipboard.readText());
        
        const newContext = await this.browser.newContext({ storageState: undefined })
        const incognito = await newContext.newPage()
        await incognito.goto(copiedLink)
        
        await expect(incognito.locator(FORM_HEADER_SELECTORS.passwordHeading)).toBeVisible()
        await incognito.locator(FORM_INPUT_SELECTORS.passwordInput).fill("sample123")
        await incognito.locator('button', { hasText: 'Submit' }).click()
        
        await expect(incognito.locator(FORM_HEADER_SELECTORS.welcomeScreen)).toBeVisible()
        await incognito.locator(FORM_INPUT_SELECTORS.email).fill(SUBMISSION_USER_DETAILS.email)
        
        await incognito.getByRole('button', {name: 'Submit'}).click()
        await expect(
            incognito.locator('div')
            .filter({ hasText: SUCCESS_MESSAGE.responseSuccess })
            .nth(3)
        ).toBeVisible({ timeout: 60000 })
        
        await newContext.close()
        await incognito.close()
    }

    addInputsAndSetupQuestion = async()=>{
        await this.page.getByRole('button', { name: 'Single choice' }).click()
        await this.page.getByPlaceholder('Question').fill("Interested in Playwright ?")
        
        await expect(this.page.getByText(FORM_LABELS.bulkOptionAdd)).toBeVisible()
        await this.page.getByTestId(FORM_INPUT_SELECTORS.inputOption2).hover()
        await this.page.getByTestId(FORM_INPUT_SELECTORS.deleteOption2).click()
        await this.page.getByTestId(FORM_INPUT_SELECTORS.inputOption2).hover()
        await this.page.getByTestId(FORM_INPUT_SELECTORS.deleteOption2).click()

        await this.page.getByTestId(FORM_INPUT_SELECTORS.inputOption0).fill("Yes")
        await this.page.getByTestId(FORM_INPUT_SELECTORS.inputOption1).fill("No")

        await this.page.getByRole('button', { name: 'Summary' }).click()
        const email = this.page.getByRole('button', { name: 'Email address' })
        const singleChoice = this.page.getByRole('button', { name: 'Interested in Playwright ?' })

        await email.dragTo(singleChoice)
    }

    formDeletion = async({formName}:{formName: string})=>{
        const formRowLocator = this.page.locator('div')
        .filter({ hasText: new RegExp(`^${formName}$`, 'i') })
        .locator('div')
        .getByRole('button')

        await formRowLocator.nth(0).click()
        
        await this.page.getByRole('button', { name: 'Delete' }).click()
        await this.page.getByTestId(FORM_INPUT_SELECTORS.deleteCheckbox).click()
        await this.page.getByRole('button', { name: 'Delete' }).click()

        await this.page.waitForSelector(`text=Form ${formName}`, { state: 'detached' })
    }
}