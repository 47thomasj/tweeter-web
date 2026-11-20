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
import { SessionService } from "./SessionService";

export class StatusService implements Service {
  private readonly feedDao: FeedDao;
  private readonly statusDao: StatusDao;
  private readonly sessionService: SessionService;

  public constructor(daoFactory: DaoFactory) {
    this.feedDao = daoFactory.getFeedDao();
    this.statusDao = daoFactory.getStatusDao();
    this.sessionService = new SessionService(daoFactory);
  }

  public async loadMoreFeedItems(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: StatusDto | null,
  ): Promise<[StatusDto[], boolean]> {
    await this.sessionService.validateSession(token);
    this.validatePageRequest(userAlias, pageSize, lastItem);

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
    await this.sessionService.validateSession(token);
    this.validatePageRequest(userAlias, pageSize, lastItem);

    const page = await this.statusDao.getPageOfStoryItems(
      userAlias,
      pageSize,
      lastItem?.timestamp,
    );
    return [page.items, page.hasMore];
  }

  public async postStatus(token: string, newStatus: StatusDto): Promise<void> {
    await this.sessionService.validateSession(token);
    requireStatusDto(newStatus);

    await this.statusDao.putItem(newStatus);
  }

  private validatePageRequest(
    userAlias: string,
    pageSize: number,
    lastItem: StatusDto | null,
  ): void {
    requireNonEmptyStrings(userAlias);
    requirePositiveNumber(pageSize);

    if (lastItem !== null) {
      requireStatusDto(lastItem);
    }
  }
}
