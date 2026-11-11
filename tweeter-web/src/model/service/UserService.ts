// Partially written by AI.

import {
  AuthToken,
  FollowRequest,
  GetFollowCountRequest,
  GetIsFollowerStatusRequest,
  GetUserRequest,
  UnfollowRequest,
  User,
} from "tweeter-shared";
import { ServerFacade } from "../ServerFacade";
import { Service } from "./Service";

export class UserService implements Service {
  private serverFacade = new ServerFacade();

  public async getUser(
    authToken: AuthToken,
    alias: string,
  ): Promise<User | null> {
    const request: GetUserRequest = {
      token: authToken.token,
      alias,
    };

    return this.serverFacade.getUser(request);
  }

  public async getIsFollowerStatus(
    authToken: AuthToken,
    user: User,
    selectedUser: User,
  ): Promise<boolean> {
    const request: GetIsFollowerStatusRequest = {
      token: authToken.token,
      user: user.dto,
      selectedUser: selectedUser.dto,
    };

    return this.serverFacade.getIsFollowerStatus(request);
  }

  public async getFolloweeCount(
    authToken: AuthToken,
    user: User,
  ): Promise<number> {
    const request: GetFollowCountRequest = {
      token: authToken.token,
      user: user.dto,
    };

    return this.serverFacade.getFolloweeCount(request);
  }

  public async getFollowerCount(
    authToken: AuthToken,
    user: User,
  ): Promise<number> {
    const request: GetFollowCountRequest = {
      token: authToken.token,
      user: user.dto,
    };

    return this.serverFacade.getFollowerCount(request);
  }

  public async follow(
    authToken: AuthToken,
    userToFollow: User,
  ): Promise<[followerCount: number, followeeCount: number]> {
    const request: FollowRequest = {
      token: authToken.token,
      userToFollow: userToFollow.dto,
    };

    return this.serverFacade.follow(request);
  }

  public async unfollow(
    authToken: AuthToken,
    userToUnfollow: User,
  ): Promise<[followerCount: number, followeeCount: number]> {
    const request: UnfollowRequest = {
      token: authToken.token,
      userToUnfollow: userToUnfollow.dto,
    };

    return this.serverFacade.unfollow(request);
  }
}
