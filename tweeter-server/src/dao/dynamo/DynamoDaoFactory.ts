// Partially written by AI.
import type { DaoFactory } from "../DaoFactory";
import type { FollowDao } from "../FollowDao";
import type { UserDao } from "../UserDao";
import { DynamoFollowDao } from "./DynamoFollowDao";
import { DynamoUserDao } from "./DynamoUserDao";

export class DynamoDaoFactory implements DaoFactory {
  private readonly followDao: FollowDao;
  private readonly userDao: UserDao;

  public constructor(
    userTableName = "users",
    followTableName = "follows",
    followIndexName = "follows_index",
  ) {
    this.userDao = new DynamoUserDao(userTableName);
    this.followDao = new DynamoFollowDao(
      followTableName,
      followIndexName,
    );
  }

  public getFollowDao(): FollowDao {
    return this.followDao;
  }

  public getUserDao(): UserDao {
    return this.userDao;
  }
}
