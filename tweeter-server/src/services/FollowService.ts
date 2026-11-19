// Partially written by AI.

import type { UserDto } from "tweeter-shared";
import {
  requireNonEmptyStrings,
  requirePositiveNumber,
  requireUserDto,
} from "./RequestValidation";
import type { DaoFactory } from "../dao/DaoFactory";
import type { FollowDao } from "../dao/FollowDao";
import type { UserPage } from "../dao/DataPage";
import type { UserDao } from "../dao/UserDao";

export class FollowService {
  private readonly followDao: FollowDao;
  private readonly userDao: UserDao;
  
  public constructor(private readonly daoFactory: DaoFactory) {
    this.followDao = daoFactory.getFollowDao();
    this.userDao = daoFactory.getUserDao();
  }

  public async loadMoreFollowees(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: UserDto | null,
  ): Promise<UserPage> {
    this.validatePageRequest(token, userAlias, pageSize, lastItem);
    const page = await this.followDao.getPageOfFollowees(
      userAlias,
      pageSize,
      lastItem?.alias,
    );
    const users = await this.loadUsers(
      page.items.map((follow) => follow.followeeHandle),
    );

    return [users, page.hasMore];
  }

  public async loadMoreFollowers(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: UserDto | null,
  ): Promise<UserPage> {
    this.validatePageRequest(token, userAlias, pageSize, lastItem);
    const page = await this.followDao.getPageOfFollowers(
      userAlias,
      pageSize,
      lastItem?.alias,
    );
    const users = await this.loadUsers(
      page.items.map((follow) => follow.followerHandle),
    );

    return [users, page.hasMore];
  }

  private validatePageRequest(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: UserDto | null,
  ): void {
    requireNonEmptyStrings(token, userAlias);
    requirePositiveNumber(pageSize);

    if (lastItem !== null) {
      requireUserDto(lastItem);
    }
  }

  private async loadUsers(handles: string[]): Promise<UserDto[]> {
    const usersByAlias = await this.userDao.getBatchUsers(handles);

    return handles.map((handle) => {
      const user = usersByAlias.get(handle);
      if (user === undefined) {
        throw new Error(
          `User '${handle}' referenced by a follow was not found`,
        );
      }

      return user;
    });
  }
}
