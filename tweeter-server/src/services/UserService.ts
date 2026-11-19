// Partially written by AI.

import { UserDto } from "tweeter-shared";
import { requireNonEmptyStrings, requireUserDto } from "./RequestValidation";
import { Service } from "./Service";
import type { DaoFactory } from "../dao/DaoFactory";
import type { UserDao } from "../dao/UserDao";
import type { FollowDao } from "../dao/FollowDao";

export class UserService implements Service {
  private readonly userDao: UserDao;
  private readonly followDao: FollowDao;

  public constructor(daoFactory: DaoFactory) {
    this.userDao = daoFactory.getUserDao();
    this.followDao = daoFactory.getFollowDao();
  }

  public async getUser(token: string, alias: string): Promise<UserDto | null> {
    requireNonEmptyStrings(token, alias);

    const user = await this.userDao.getItem(alias);
    return user ?? null;
  }

  public async getIsFollowerStatus(
    token: string,
    user: UserDto,
    selectedUser: UserDto,
  ): Promise<boolean> {
    requireNonEmptyStrings(token);
    requireUserDto(user);
    requireUserDto(selectedUser);

    const followRelation = await this.followDao.getItem(
      user.alias,
      selectedUser.alias,
    );
    return followRelation !== undefined;
  }

  public async getFolloweeCount(token: string, user: UserDto): Promise<number> {
    requireNonEmptyStrings(token);
    requireUserDto(user);

    return this.followDao.getFolloweeCount(user.alias);
  }

  public async getFollowerCount(token: string, user: UserDto): Promise<number> {
    requireNonEmptyStrings(token);
    requireUserDto(user);

    return this.followDao.getFollowerCount(user.alias);
  }

  public async follow(
    token: string,
    userToFollow: UserDto,
  ): Promise<[followerCount: number, followeeCount: number]> {
    requireNonEmptyStrings(token);
    requireUserDto(userToFollow);

    await this.followDao.putItem({
      followerHandle: user.alias,
      followeeHandle: userToFollow.alias,
    });

    const followerCount = await this.getFollowerCount(token, userToFollow);
    const followeeCount = await this.getFolloweeCount(token, userToFollow);

    return [followerCount, followeeCount];
  }

  public async unfollow(
    token: string,
    userToUnfollow: UserDto,
  ): Promise<[followerCount: number, followeeCount: number]> {
    requireNonEmptyStrings(token);
    requireUserDto(userToUnfollow);

    await this.followDao.deleteItem(user.alias, userToUnfollow.alias);

    const followerCount = await this.getFollowerCount(token, userToUnfollow);
    const followeeCount = await this.getFolloweeCount(token, userToUnfollow);

    return [followerCount, followeeCount];
  }
}
