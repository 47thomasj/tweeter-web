// Partially written by AI.
import type { DaoFactory } from "../DaoFactory";
import type { AuthDao } from "../AuthDao";
import type { FeedDao } from "../FeedDao";
import type { FollowDao } from "../FollowDao";
import type { SessionDao } from "../SessionDao";
import type { StatusDao } from "../StatusDao";
import type { UserDao } from "../UserDao";
import { DynamoAuthDao } from "./DynamoAuthDao";
import { DynamoFeedDao } from "./DynamoFeedDao";
import { DynamoFollowDao } from "./DynamoFollowDao";
import { DynamoSessionDao } from "./DynamoSessionDao";
import { DynamoStatusDao } from "./DynamoStatusDao";
import { DynamoUserDao } from "./DynamoUserDao";

export class DynamoDaoFactory implements DaoFactory {
  private readonly authDao: AuthDao;
  private readonly sessionDao: SessionDao
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
    authTableName = "auth",
    sessionsTableName = "sessions",
  ) {
    this.authDao = new DynamoAuthDao(authTableName);
    this.sessionDao = new DynamoSessionDao(sessionsTableName);
    this.userDao = new DynamoUserDao(userTableName);
    this.followDao = new DynamoFollowDao(followTableName, followIndexName);
    this.statusDao = new DynamoStatusDao(statusTableName);
    this.feedDao = new DynamoFeedDao(feedTableName);
  }

  public getAuthDao(): AuthDao {
    return this.authDao;
  }

  public getFeedDao(): FeedDao {
    return this.feedDao;
  }

  public getFollowDao(): FollowDao {
    return this.followDao;
  }

  public getSessionDao(): SessionDao {
    return this.sessionDao;
  }

  public getStatusDao(): StatusDao {
    return this.statusDao;
  }

  public getUserDao(): UserDao {
    return this.userDao;
  }
}
