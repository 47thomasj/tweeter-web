import { AuthPresenter, AuthView } from "./AuthPresenter";

//TODO: doAuth can hold more stuff. Navigation, authenticate, etc. 

export class LoginPresenter extends AuthPresenter {
  public constructor(view: AuthView, originalUrl?: string) {
    super(view, originalUrl);
  }

  public async doAuth(alias: string, password: string): Promise<void> {
    await this.doFailureReportingOperation(async () => {
      this.view.setIsLoading(true);
      const [user, authToken] = await this.authService.login(alias, password);

      this.view.updateUserInfo(user, authToken);

      if (!!this.originalUrl) {
        this.view.navigate(this.originalUrl);
      } else {
        this.view.navigate(`/feed/${user.alias}`);
      }
    }, "log user in");
    this.view.setIsLoading(false);
  }

  public checkSubmitButtonStatus(alias: string, password: string): boolean {
    return !alias || !password;
  }
}
