import { test as base, Page } from "@playwright/test";
import UserLogin from "../poms/login";

interface Extended {
    login: UserLogin
}

export const test = base.extend<Extended>({
    login: async({page}:{page: Page}, use)=>{
        const login = new UserLogin(page)
        use(login)
    }
})