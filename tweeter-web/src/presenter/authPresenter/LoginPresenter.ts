import { AuthPresenter, AuthView} from "./AuthPresenter";

export class LoginPresenter extends AuthPresenter {
  public constructor(view: AuthView, originalUrl?: string) {
    super(view, originalUrl);
  }

  public async login(alias: string, password: string): Promise<void> {
    try {
      this.isLoading = true;
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
      this.isLoading = false;
    }
  }
}
