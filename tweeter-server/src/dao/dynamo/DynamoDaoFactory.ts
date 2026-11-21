// Partially written by AI.
import type { DaoFactory } from "../DaoFactory";
import type { AuthDao } from "../AuthDao";
import type { FeedDao } from "../FeedDao";
import type { FollowDao } from "../FollowDao";
import type { ImageDao } from "../ImageDao";
import type { SessionDao } from "../SessionDao";
import type { StatusDao } from "../StatusDao";
import type { UserDao } from "../UserDao";
import { DynamoAuthDao } from "./DynamoAuthDao";
import { DynamoFeedDao } from "./DynamoFeedDao";
import { DynamoFollowDao } from "./DynamoFollowDao";
import { DynamoSessionDao } from "./DynamoSessionDao";
import { DynamoStatusDao } from "./DynamoStatusDao";
import { DynamoUserDao } from "./DynamoUserDao";
import { S3Dao } from "../s3/S3Dao";

export class DynamoDaoFactory implements DaoFactory {
  private readonly authDao: AuthDao;
  private readonly feedDao: FeedDao;
  private readonly followDao: FollowDao;
  private readonly imageDao: ImageDao;
  private readonly sessionDao: SessionDao;
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
    this.imageDao = new S3Dao();
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

  public getImageDao(): ImageDao {
    return this.imageDao;
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
