// Partially written by AI.

import { FakeData, UserDto } from "tweeter-shared";
import {
  requireNonEmptyStrings,
  requireUserDto,
} from "./RequestValidation";
import { Service } from "./Service";

export class UserService implements Service {
  public async getUser(
    token: string,
    alias: string,
  ): Promise<UserDto | null> {
    requireNonEmptyStrings(token, alias);

    // TODO: Replace with the result of calling server
    return FakeData.instance.findUserByAlias(alias)?.dto ?? null;
  }

  public async getIsFollowerStatus(
    token: string,
    user: UserDto,
    selectedUser: UserDto,
  ): Promise<boolean> {
    requireNonEmptyStrings(token);
    requireUserDto(user);
    requireUserDto(selectedUser);

    // TODO: Replace with the result of calling server
    return FakeData.instance.isFollower();
  }

  public async getFolloweeCount(
    token: string,
    user: UserDto,
  ): Promise<number> {
    requireNonEmptyStrings(token);
    requireUserDto(user);

    // TODO: Replace with the result of calling server
    return FakeData.instance.getFolloweeCount(user.alias);
  }

  public async getFollowerCount(
    token: string,
    user: UserDto,
  ): Promise<number> {
    requireNonEmptyStrings(token);
    requireUserDto(user);

    // TODO: Replace with the result of calling server
    return FakeData.instance.getFollowerCount(user.alias);
  }

  public async follow(
    token: string,
    userToFollow: UserDto,
  ): Promise<[followerCount: number, followeeCount: number]> {
    requireNonEmptyStrings(token);
    requireUserDto(userToFollow);

    // Pause so we can see the follow message. Remove when connected to the server
    await new Promise((f) => setTimeout(f, 2000));

    // TODO: Call the server

    const followerCount = await this.getFollowerCount(
      token,
      userToFollow,
    );
    const followeeCount = await this.getFolloweeCount(
      token,
      userToFollow,
    );

    return [followerCount, followeeCount];
  }

  public async unfollow(
    token: string,
    userToUnfollow: UserDto,
  ): Promise<[followerCount: number, followeeCount: number]> {
    requireNonEmptyStrings(token);
    requireUserDto(userToUnfollow);

    // Pause so we can see the unfollow message. Remove when connected to the server
    await new Promise((f) => setTimeout(f, 2000));

    // TODO: Call the server

    const followerCount = await this.getFollowerCount(
      token,
      userToUnfollow,
    );
    const followeeCount = await this.getFolloweeCount(
      token,
      userToUnfollow,
    );

    return [followerCount, followeeCount];
  }
}
