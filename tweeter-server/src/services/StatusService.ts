// Partially written by AI.

import type { StatusDto } from "tweeter-shared";
import {
  requireNonEmptyStrings,
  requirePositiveNumber,
  requireStatusDto,
} from "./RequestValidation";
import type { DaoFactory } from "../dao/DaoFactory";
import type { FeedDao } from "../dao/FeedDao";
import type { StatusDao } from "../dao/StatusDao";
import { Service } from "./Service";

export class StatusService implements Service {
  private readonly feedDao: FeedDao;
  private readonly statusDao: StatusDao;

  public constructor(daoFactory: DaoFactory) {
    this.feedDao = daoFactory.getFeedDao();
    this.statusDao = daoFactory.getStatusDao();
  }

  public async loadMoreFeedItems(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: StatusDto | null,
  ): Promise<[StatusDto[], boolean]> {
    this.validatePageRequest(token, userAlias, pageSize, lastItem);

    const page = await this.feedDao.getPageOfFeedItems(
      userAlias,
      pageSize,
      lastItem?.timestamp,
    );
    const statuses = await this.statusDao.getBatchStatuses(
      page.items.map((item) => ({
        userAlias: item.statusUserAlias,
        timestamp: item.timestamp,
      })),
    );

    return [
      page.items.map((item, index) => {
        const status = statuses[index];
        if (status === undefined) {
          throw new Error(
            `Status '${item.statusUserAlias}:${item.timestamp}' referenced by a feed was not found`,
          );
        }

        return status;
      }),
      page.hasMore,
    ];
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

}
