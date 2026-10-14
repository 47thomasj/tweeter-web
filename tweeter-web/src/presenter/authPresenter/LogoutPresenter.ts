import { AuthService } from "../../model.service/AuthService";
import { AuthToken } from "tweeter-shared";
import { MessageView, Presenter } from "../Presenter";

export interface LogoutView extends MessageView {
  clearUserInfo: () => void;
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
