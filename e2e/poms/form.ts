import { Browser, expect, Page } from "@playwright/test"

interface Submission {
    repeat?: number,
    incognito?: string,
    cookies?: boolean
}

export default class UserForm{
    constructor(
        private page: Page,
        private browser: Browser
    ){}

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
}