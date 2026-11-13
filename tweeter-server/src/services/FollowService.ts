// Partially written by AI.

import { FakeData, User, UserDto } from "tweeter-shared";
import {
  requireNonEmptyStrings,
  requirePositiveNumber,
  requireUserDto,
} from "./RequestValidation";

export class FollowService {
  public async loadMoreFollowees(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: UserDto | null,
  ): Promise<[UserDto[], boolean]> {
    this.validatePageRequest(token, userAlias, pageSize, lastItem);

    // TODO: Replace with the result of calling server
    return this.getFakeData(lastItem, pageSize, userAlias);
  }

  public async loadMoreFollowers(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: UserDto | null,
  ): Promise<[UserDto[], boolean]> {
    this.validatePageRequest(token, userAlias, pageSize, lastItem);

    // TODO: Replace with the result of calling server
    return this.getFakeData(lastItem, pageSize, userAlias);
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
