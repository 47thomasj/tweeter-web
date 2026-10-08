import { AuthToken, User } from "tweeter-shared";
import { UserService } from "../model.service/UserService";

export interface UserInfoView {
  setDisplayedUser: (user: User) => void;
  navigate: (url: string) => void;
  displayInfoMessage: (message: string, timeout: number) => string;
  displayErrorMessage: (message: string) => void;
  deleteMessage: (message: string) => void;
  setIsFollower: (isFollower: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setFollowerCount: (followerCount: number) => void;
  setFolloweeCount: (followeeCount: number) => void;
}

export class UserInfoPresenter {
  private view: UserInfoView;
  private userService: UserService;

  private _currentUser: User;
  private _authToken: AuthToken;

  public constructor(
    view: UserInfoView,
    currentUser: User,
    authToken: AuthToken,
  ) {
    this.view = view;
    this.userService = new UserService();
    this._currentUser = currentUser;
    this._authToken = authToken;
  }

  public async unfollowUser(displayedUser: User) {
    var unfollowingUserToast = "";
    try {
      this.view.setIsLoading(true);
      unfollowingUserToast = this.view.displayInfoMessage(
        `Unfollowing ${displayedUser.name}...`,
        0,
      );

      const [followerCount, followeeCount] = await this.userService.unfollow(
        this._authToken!,
        displayedUser,
      );

      this.view.setIsFollower(false);
      this.view.setFollowerCount(followerCount);
      this.view.setFolloweeCount(followeeCount);
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to unfollow user because of exception: ${error}`,
      );
    } finally {
      this.view.deleteMessage(unfollowingUserToast);
      this.view.setIsLoading(false);
    }
  }

  public async followUser(displayedUser: User) {
    var followingUserToast = "";

    try {
      this.view.setIsLoading(true);
      followingUserToast = this.view.displayInfoMessage(
        `Following ${displayedUser.name}...`,
        0,
      );

      const [followerCount, followeeCount] = await this.userService.follow(
        this._authToken!,
        displayedUser,
      );

      this.view.setIsFollower(true);
      this.view.setFollowerCount(followerCount);
      this.view.setFolloweeCount(followeeCount);
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to follow user because of exception: ${error}`,
      );
    } finally {
      this.view.deleteMessage(followingUserToast);
      this.view.setIsLoading(false);
    }
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
    try {
      this.view.setFollowerCount(
        await this.userService.getFollowerCount(authToken, displayedUser),
      );
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to get followers count because of exception: ${error}`,
      );
    }
  }

  public async setNumbFollowees(
    authToken: AuthToken,
    displayedUser: User,
  ): Promise<void> {
    try {
      this.view.setFolloweeCount(
        await this.userService.getFolloweeCount(authToken, displayedUser),
      );
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to get followees count because of exception: ${error}`,
      );
    }
  }

  public async setIsFollowerStatus(
    authToken: AuthToken,
    currentUser: User,
    displayedUser: User,
  ): Promise<void> {
    try {
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
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to determine follower status because of exception: ${error}`,
      );
    }
  }
}
