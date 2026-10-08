import { AuthService } from "../../model.service/AuthService";
import { AuthToken } from "tweeter-shared";

export interface LogoutView {
  deleteMessage: (message: string) => void;
  displayInfoMessage: (message: string, timeout: number) => string;
  clearUserInfo: () => void;
  displayErrorMessage: (message: string) => void;
  navigate: (url: string) => void;
}

export class LogoutPresenter {
  private view: LogoutView;
  private authService: AuthService;

  public constructor(view: LogoutView) {
    this.view = view;
    this.authService = new AuthService();
  }

  public async logout(authToken: AuthToken): Promise<void> {
    const loggingOutToastId = this.view.displayInfoMessage("Logging Out...", 0);

    try {
      await this.authService.logout(authToken!);

      this.view.deleteMessage(loggingOutToastId);
      this.view.clearUserInfo();
      this.view.navigate("/login");
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to log user out because of exception: ${error}`,
      );
    }
  }
}
