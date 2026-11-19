// Partially written by AI.
import type { DaoFactory } from "../DaoFactory";
import type { FeedDao } from "../FeedDao";
import type { FollowDao } from "../FollowDao";
import type { StatusDao } from "../StatusDao";
import type { UserDao } from "../UserDao";
import { DynamoFeedDao } from "./DynamoFeedDao";
import { DynamoFollowDao } from "./DynamoFollowDao";
import { DynamoStatusDao } from "./DynamoStatusDao";
import { DynamoUserDao } from "./DynamoUserDao";

export class DynamoDaoFactory implements DaoFactory {
  private readonly feedDao: FeedDao;
  private readonly followDao: FollowDao;
  private readonly statusDao: StatusDao;
  private readonly userDao: UserDao;

  public constructor(
    userTableName = "users",
    followTableName = "follows",
    followIndexName = "follows_index",
    statusTableName = "statuses",
    feedTableName = "feed",
  ) {
    this.userDao = new DynamoUserDao(userTableName);
    this.followDao = new DynamoFollowDao(followTableName, followIndexName);
    this.statusDao = new DynamoStatusDao(statusTableName);
    this.feedDao = new DynamoFeedDao(feedTableName);
  }

  public getFeedDao(): FeedDao {
    return this.feedDao;
  }

  public getFollowDao(): FollowDao {
    return this.followDao;
  }

  public getStatusDao(): StatusDao {
    return this.statusDao;
  }

  public getUserDao(): UserDao {
    return this.userDao;
  }
}
