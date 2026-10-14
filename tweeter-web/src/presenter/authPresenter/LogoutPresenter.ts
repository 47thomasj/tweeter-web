import { AuthService } from "../../model.service/AuthService";
import { AuthToken } from "tweeter-shared";
import { Presenter, View } from "../Presenter";

export interface LogoutView extends View {
  deleteMessage: (message: string) => void;
  displayInfoMessage: (message: string, timeout: number) => string;
  clearUserInfo: () => void;
  displayErrorMessage: (message: string) => void;
  navigate: (url: string) => void;
}

export class LogoutPresenter extends Presenter<LogoutView> {
  private authService: AuthService;

  public constructor(view: LogoutView) {
    super(view);
    this.authService = new AuthService();
  }

  public async logout(authToken: AuthToken): Promise<void> {
    const loggingOutToastId = this.view.displayInfoMessage("Logging Out...", 0);
    await this.doFailureReportingOperation(async () => {
      await this.authService.logout(authToken!);

      this.view.deleteMessage(loggingOutToastId);
      this.view.clearUserInfo();
      this.view.navigate("/login");
    }, "log user out");
  }
}
