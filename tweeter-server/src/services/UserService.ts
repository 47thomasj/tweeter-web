// Partially written by AI.

import { UserDto } from "tweeter-shared";
import { requireNonEmptyStrings, requireUserDto } from "./RequestValidation";
import { Service } from "./Service";
import type { DaoFactory } from "../dao/DaoFactory";
import type { UserDao } from "../dao/UserDao";
import type { FollowDao } from "../dao/FollowDao";
import { SessionService } from "./SessionService";
import { ClientError } from "./ClientError";

export class UserService implements Service {
  private readonly userDao: UserDao;
  private readonly followDao: FollowDao;
  private readonly sessionService: SessionService;

  public constructor(daoFactory: DaoFactory) {
    this.userDao = daoFactory.getUserDao();
    this.followDao = daoFactory.getFollowDao();
    this.sessionService = new SessionService(daoFactory);
  }

  public async getUser(token: string, alias: string): Promise<UserDto | null> {
    await this.sessionService.validateSession(token);
    requireNonEmptyStrings(alias);

    const user = await this.userDao.getItem(alias);
    return user ?? null;
  }

  public async getIsFollowerStatus(
    token: string,
    user: UserDto,
    selectedUser: UserDto,
  ): Promise<boolean> {
    await this.sessionService.validateSession(token);
    requireUserDto(user);
    requireUserDto(selectedUser);

    const followRelation = await this.followDao.getItem(
      user.alias,
      selectedUser.alias,
    );
    return followRelation !== undefined;
  }

  public async getFolloweeCount(token: string, user: UserDto): Promise<number> {
    await this.sessionService.validateSession(token);
    requireUserDto(user);

    return this.followDao.getFolloweeCount(user.alias);
  }

  public async getFollowerCount(token: string, user: UserDto): Promise<number> {
    await this.sessionService.validateSession(token);
    requireUserDto(user);

    return this.followDao.getFollowerCount(user.alias);
  }

  public async follow(
    token: string,
    userToFollow: UserDto,
  ): Promise<[followerCount: number, followeeCount: number]> {
    const userAlias = await this.sessionService.validateSession(token);
    requireUserDto(userToFollow);

    if (userAlias === userToFollow.alias) {
      throw new ClientError("Cannot follow yourself");
    }

    const [storedUser, existingFollow] = await Promise.all([
      this.userDao.getItem(userToFollow.alias),
      this.followDao.getItem(userAlias, userToFollow.alias),
    ]);
    if (storedUser === undefined) {
      throw new ClientError("User does not exist");
    }
    if (existingFollow !== undefined) {
      throw new ClientError("Already following user");
    }

    await this.followDao.putItem({
      followerHandle: userAlias,
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
    const userAlias = await this.sessionService.validateSession(token);
    requireUserDto(userToUnfollow);

    if (userAlias === userToUnfollow.alias) {
      throw new ClientError("Cannot unfollow yourself");
    }

    const [storedUser, existingFollow] = await Promise.all([
      this.userDao.getItem(userToUnfollow.alias),
      this.followDao.getItem(userAlias, userToUnfollow.alias),
    ]);
    if (storedUser === undefined) {
      throw new ClientError("User does not exist");
    }
    if (existingFollow === undefined) {
      throw new ClientError("Not following user");
    }

    await this.followDao.deleteItem(userAlias, userToUnfollow.alias);

    const followerCount = await this.getFollowerCount(token, userToUnfollow);
    const followeeCount = await this.getFolloweeCount(token, userToUnfollow);

    return [followerCount, followeeCount];
  }
}
