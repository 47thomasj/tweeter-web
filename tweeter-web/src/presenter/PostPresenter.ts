import { AuthToken, Status, User } from "tweeter-shared";
import { StatusService } from "../model.service/StatusService";
import { Presenter, MessageView } from "./Presenter";

export interface PostView extends MessageView {
  setIsLoading: (isLoading: boolean) => void;
  setPost: (post: string) => void;
}

export class PostPresenter extends Presenter<PostView> {
  private _statusService: StatusService;
  private _authToken: AuthToken;

  public constructor(view: PostView, authToken: AuthToken) {
    super(view);
    this._statusService = new StatusService();
    this._authToken = authToken;
  }

  public async submitPost(post: string, currentUser: User) {
    var postingStatusToastId = "";

    await this.doFailureReportingOperation(async () => {
      this.view.setIsLoading(true);
      postingStatusToastId = this.view.displayInfoMessage(
        "Posting status...",
        0,
      );

      const status = new Status(post, currentUser!, Date.now());

      await this._statusService.postStatus(this._authToken!, status);

      this.view.setPost("");
      this.view.displayInfoMessage("Status posted!", 2000);
    }, "post the status");

    this.view.deleteMessage(postingStatusToastId);
    this.view.setIsLoading(false);
  }

  public checkButtonStatus(
    post: string,
    currentUser: User,
    isLoading: boolean,
  ): boolean {
    return !post.trim() || !this._authToken || !currentUser || isLoading;
  }
}
