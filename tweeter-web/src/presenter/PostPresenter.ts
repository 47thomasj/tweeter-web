import { AuthToken, Status, User } from "tweeter-shared";
import { StatusService } from "../model.service/StatusService";

export interface PostView {
  displayErrorMessage: (message: string) => void;
  displayInfoMessage: (message: string, timeout: number) => string;
  deleteMessage: (message: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setPost: (post: string) => void;
}

export class PostPresenter {
  private _view: PostView;
  private _statusService: StatusService;
  private _authToken: AuthToken;

  public constructor(view: PostView, authToken: AuthToken) {
    this._view = view;
    this._statusService = new StatusService();
    this._authToken = authToken;
  }

  public async submitPost(post: string, currentUser: User) {
    var postingStatusToastId = "";

    try {
      this._view.setIsLoading(true);
      postingStatusToastId = this._view.displayInfoMessage(
        "Posting status...",
        0,
      );

      const status = new Status(post, currentUser!, Date.now());

      await this._statusService.postStatus(this._authToken!, status);

      this._view.setPost("");
      this._view.displayInfoMessage("Status posted!", 2000);
    } catch (error) {
      this._view.displayErrorMessage(
        `Failed to post the status because of exception: ${error}`,
      );
    } finally {
      this._view.deleteMessage(postingStatusToastId);
      this._view.setIsLoading(false);
    }
  }
}
