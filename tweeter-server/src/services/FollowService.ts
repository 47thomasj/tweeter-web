// Partially written by AI.

import { FakeData, User, UserDto } from "tweeter-shared";
import {
  requireNonEmptyStrings,
  requirePositiveNumber,
  requireUserDto,
} from "./RequestValidation";
import { DynamoFollowDao } from "../dao/dynamo/DynamoFollowDao";
import { FollowDao } from "../dao/FollowDao";
import { UserPage } from "../dao/DataPage";

export class FollowService {
  private readonly followDao: FollowDao = new DynamoFollowDao("follows");

  public async loadMoreFollowees(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: UserDto | null,
  ): Promise<UserPage> {
    this.validatePageRequest(token, userAlias, pageSize, lastItem);
    return this.followDao.getPageOfFollowees(userAlias, pageSize, lastItem?.alias);
  }

  public async loadMoreFollowers(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: UserDto | null,
  ): Promise<UserPage> {
    this.validatePageRequest(token, userAlias, pageSize, lastItem); 
    return this.followDao.getPageOfFollowers(userAlias, pageSize, lastItem?.alias);
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

  private async getFakeData(
    lastItem: UserDto | null,
    pageSize: number,
    userAlias: string,
  ): Promise<[UserDto[], boolean]> {
    const [items, hasMore] = FakeData.instance.getPageOfUsers(
      User.fromDto(lastItem),
      pageSize,
      userAlias,
    );
    const dtos = items.map((user) => user.dto);
    return [dtos, hasMore];
  }
}
