// Partially written by AI.
import type { DaoFactory } from "../DaoFactory";
import type { FollowDao } from "../FollowDao";
import type { UserDao } from "../UserDao";
import { DynamoFollowDao } from "./DynamoFollowDao";

export class DynamoDaoFactory implements DaoFactory {
  private readonly followDao: FollowDao;

  public constructor(
    private readonly userDao?: UserDao,
    followTableName = "follows",
    followIndexName = "follows_index",
  ) {
    this.followDao = new DynamoFollowDao(
      followTableName,
      followIndexName,
    );
  }

  public getFollowDao(): FollowDao {
    return this.followDao;
  }

  public getUserDao(): UserDao {
    if (this.userDao === undefined) {
      throw new Error("Dynamo user DAO has not been implemented");
    }

    return this.userDao;
  }
}
