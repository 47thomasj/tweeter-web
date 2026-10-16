import { AuthPresenter, AuthView } from "./AuthPresenter";

//TODO: doAuth can hold more stuff. Navigation, authenticate, etc. 

export class LoginPresenter extends AuthPresenter {
  public constructor(view: AuthView, originalUrl?: string) {
    super(view, originalUrl);
  }

  public async doAuth(alias: string, password: string): Promise<void> {
    await this.doAuthOperation(async () => {
      return this.authService.login(alias, password);
    }, "log user in");
  }

  public checkSubmitButtonStatus(alias: string, password: string): boolean {
    return !alias || !password;
  }
}
