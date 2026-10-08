import { AuthPresenter, AuthView} from "./AuthPresenter";

export class LoginPresenter extends AuthPresenter {
  public constructor(view: AuthView, originalUrl?: string) {
    super(view, originalUrl);
  }

  public async doAuth(alias: string, password: string): Promise<void> {
    try {
      this.view.setIsLoading(true);
      const [user, authToken] = await this.authService.login(alias, password);

      this.view.updateUserInfo(user, authToken);

      if (!!this.originalUrl) {
        this.view.navigate(this.originalUrl);
      } else {
        this.view.navigate(`/feed/${user.alias}`);
      }
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to log user in because of exception: ${error}`,
      );
    } finally {
      this.view.setIsLoading(false);
    }
  }

  public checkSubmitButtonStatus(alias: string, password: string): boolean {
    return !alias || !password;
  };
}
