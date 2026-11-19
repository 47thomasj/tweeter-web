// Partially written by AI.

import { FakeData, Status, StatusDto } from "tweeter-shared";
import {
  requireNonEmptyStrings,
  requirePositiveNumber,
  requireStatusDto,
} from "./RequestValidation";
import type { DaoFactory } from "../dao/DaoFactory";
import type { StatusDao } from "../dao/StatusDao";
import { Service } from "./Service";

export class StatusService implements Service {
  private readonly statusDao: StatusDao;

  public constructor(daoFactory: DaoFactory) {
    this.statusDao = daoFactory.getStatusDao();
  }

  public async loadMoreFeedItems(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: StatusDto | null,
  ): Promise<[StatusDto[], boolean]> {
    this.validatePageRequest(token, userAlias, pageSize, lastItem);

    // TODO: Replace when the precomputed feed DAO is implemented
    return this.getFakeData(lastItem, pageSize, userAlias);
  }

  public async loadMoreStoryItems(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: StatusDto | null,
  ): Promise<[StatusDto[], boolean]> {
    this.validatePageRequest(token, userAlias, pageSize, lastItem);

    const page = await this.statusDao.getPageOfStoryItems(
      userAlias,
      pageSize,
      lastItem?.timestamp,
    );
    return [page.items, page.hasMore];
  }

  public async postStatus(
    token: string,
    newStatus: StatusDto,
  ): Promise<void> {
    requireNonEmptyStrings(token);
    requireStatusDto(newStatus);

    await this.statusDao.putItem(newStatus);
  }

  private validatePageRequest(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: StatusDto | null,
  ): void {
    requireNonEmptyStrings(token, userAlias);
    requirePositiveNumber(pageSize);

    if (lastItem !== null) {
      requireStatusDto(lastItem);
    }
  }

  private async getFakeData(
    lastItem: StatusDto | null,
    pageSize: number,
    userAlias: string,
  ): Promise<[StatusDto[], boolean]> {
    const [items, hasMore] = FakeData.instance.getPageOfStatuses(
      Status.fromDto(lastItem),
      pageSize,
    );
    const dtos = items.map((status) => status.dto);
    return [dtos, hasMore];
  }
}
