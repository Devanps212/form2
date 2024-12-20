import { Page } from "@playwright/test";
import { test } from "../fixture";
import UserLogin from "../poms/login";
import { STORAGE_STATE } from "../../playwright.config";

test.describe('User login', ()=>{
    test('should login user', async({
        login,
        page
    } : {
        login: UserLogin,
        page: Page})=>{
        await test.step("Step 1: Visit login page", async()=> await page.goto('/login'))
        await test.step("Step 2: Login user", async()=>await login.loginUser())
        await test.step("Step 3: Store session", async()=>await page.context()
        .storageState({path: STORAGE_STATE}))
    })
})