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
import type { FollowDao } from "../dao/FollowDao";
import type { UserDao } from "../dao/UserDao";
import { ClientError } from "./ClientError";

export class StatusService implements Service {
  private readonly followDao: FollowDao;
  private readonly feedDao: FeedDao;
  private readonly statusDao: StatusDao;
  private readonly sessionService: SessionService;
  private readonly userDao: UserDao;

  public constructor(daoFactory: DaoFactory) {
    this.followDao = daoFactory.getFollowDao();
    this.feedDao = daoFactory.getFeedDao();
    this.statusDao = daoFactory.getStatusDao();
    this.sessionService = new SessionService(daoFactory);
    this.userDao = daoFactory.getUserDao();
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
      lastItem === null
        ? undefined
        : {
            statusUserAlias: lastItem.user.alias,
            timestamp: lastItem.timestamp,
          },
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
    const postingUserAlias = await this.sessionService.validateSession(token);
    requireStatusDto(newStatus);

    if (newStatus.user.alias !== postingUserAlias) {
      throw new ClientError("Action Not Allowed");
    }

    const [storedUser, existingStatus] = await Promise.all([
      this.userDao.getItem(postingUserAlias),
      this.statusDao.getItem(postingUserAlias, newStatus.timestamp),
    ]);
    if (
      storedUser === undefined ||
      storedUser.firstName !== newStatus.user.firstName ||
      storedUser.lastName !== newStatus.user.lastName ||
      storedUser.imageUrl !== newStatus.user.imageUrl
    ) {
      throw new ClientError("Action Not Allowed");
    }
    if (existingStatus !== undefined) {
      throw new ClientError("Status already exists");
    }

    await this.statusDao.putItem({ ...newStatus, user: storedUser });

    const followersOfUser = await this.getAllFollowers(postingUserAlias);
    await this.feedDao.putBatchFeedItems(
      followersOfUser.map((followerAlias) => ({
        feedUserAlias: followerAlias,
        statusUserAlias: postingUserAlias,
        timestamp: newStatus.timestamp,
      })),
    );
  }

  private async getAllFollowers(userAlias: string): Promise<string[]> {
    let lastFollower: string | undefined;
    const followers: string[] = [];

    while (true) {
      const page = await this.followDao.getPageOfFollowers(
        userAlias,
        10,
        lastFollower,
      );

      const lastItem = page.items[page.items.length - 1];
      if (lastItem === undefined) {
        break;
      }

      followers.push(...page.items.map((follower) => follower.followerHandle));
      if (!page.hasMore) {
        break;
      }
      lastFollower = lastItem.followerHandle;
    }

    return followers;
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
