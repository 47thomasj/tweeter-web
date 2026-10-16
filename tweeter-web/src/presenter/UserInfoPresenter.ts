import { AuthToken, User } from "tweeter-shared";
import { UserService } from "../model.service/UserService";
import { Presenter, MessageView } from "./Presenter";

//TODO: Follow and unfollow user are pretty much the same. Can split that out to a helper.

export interface UserInfoView extends MessageView {
  setDisplayedUser: (user: User) => void;
  navigate: (url: string) => void;
  setIsFollower: (isFollower: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setFollowerCount: (followerCount: number) => void;
  setFolloweeCount: (followeeCount: number) => void;
}

export class UserInfoPresenter extends Presenter<UserInfoView> {
  private userService: UserService;

  private _currentUser: User;
  private _authToken: AuthToken;

  public constructor(
    view: UserInfoView,
    currentUser: User,
    authToken: AuthToken,
  ) {
    super(view);
    this.userService = new UserService();
    this._currentUser = currentUser;
    this._authToken = authToken;
  }

  private async doFollowUnfollowUser(
    displayedUser: User,
    followStatus: "follow" | "unfollow",
    followAction: (
      authToken: AuthToken,
      displayedUser: User,
    ) => Promise<[number, number]>,
  ) {
    var followStatusUserToast = "";

    await this.doFailureReportingOperation(async () => {
      this.view.setIsLoading(true);
      followStatusUserToast = this.view.displayInfoMessage(
        `${followStatus}ing ${displayedUser.name}...`,
        0,
      );

      const [followerCount, followeeCount] = await followAction(
        this._authToken!,
        displayedUser,
      );

      this.view.setIsFollower(followStatus === "follow");
      this.view.setFollowerCount(followerCount);
      this.view.setFolloweeCount(followeeCount);
    }, `${followStatus} user`);

    this.view.deleteMessage(followStatusUserToast);
    this.view.setIsLoading(false);
  }

  public async unfollowUser(displayedUser: User) {
    await this.doFollowUnfollowUser(
      displayedUser,
      "unfollow",
      this.userService.unfollow,
    );
  }

  public async followUser(displayedUser: User) {
    await this.doFollowUnfollowUser(
      displayedUser,
      "follow",
      this.userService.follow,
    );
  }

  public _getBaseUrl(): string {
    const segments = location.pathname.split("/@");
    return segments.length > 1 ? segments[0] : "/";
  }

  public switchToLoggedInUser() {
    this.view.setDisplayedUser(this._currentUser!);
    this.view.navigate(`${this._getBaseUrl()}/${this._currentUser!.alias}`);
  }

  public async setNumbFollowers(
    authToken: AuthToken,
    displayedUser: User,
  ): Promise<void> {
    await this.doFailureReportingOperation(async () => {
      this.view.setFollowerCount(
        await this.userService.getFollowerCount(authToken, displayedUser),
      );
    }, "get followers count");
  }

  public async setNumbFollowees(
    authToken: AuthToken,
    displayedUser: User,
  ): Promise<void> {
    await this.doFailureReportingOperation(async () => {
      this.view.setFolloweeCount(
        await this.userService.getFolloweeCount(authToken, displayedUser),
      );
    }, "get followees count");
  }

  public async setIsFollowerStatus(
    authToken: AuthToken,
    currentUser: User,
    displayedUser: User,
  ): Promise<void> {
    await this.doFailureReportingOperation(async () => {
      if (currentUser === displayedUser) {
        this.view.setIsFollower(false);
      } else {
        this.view.setIsFollower(
          await this.userService.getIsFollowerStatus(
            authToken,
            currentUser,
            displayedUser,
          ),
        );
      }
    }, "determine follower status");
  }
}
