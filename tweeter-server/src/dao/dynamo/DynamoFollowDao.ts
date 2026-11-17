// Partially written by AI.
import type { DataPage } from "../DataPage";
import type { FollowDao, FollowRelation } from "../FollowDao";
import { DynamoDao } from "./DynamoDao";

export class DynamoFollowDao
  extends DynamoDao<FollowRelation, [string, string]>
  implements FollowDao
{
  private readonly followerHandleAttr = "follower_handle";
  private readonly followeeHandleAttr = "followee_handle";

  public constructor(
    tableName: string,
    private readonly indexName = "follows_index",
  ) {
    super(tableName);
  }

  protected mapItem(follow: FollowRelation): Record<string, string> {
    return {
      [this.followerHandleAttr]: follow.followerHandle,
      [this.followeeHandleAttr]: follow.followeeHandle,
    };
  }

  protected produceKey(followerHandle: string, followeeHandle: string) {
    return {
      [this.followerHandleAttr]: followerHandle,
      [this.followeeHandleAttr]: followeeHandle,
    };
  }

  protected produceItemFromReadItem(
    readItem: Record<string, unknown>,
  ): FollowRelation {
    return {
      followerHandle: this.readString(readItem, this.followerHandleAttr),
      followeeHandle: this.readString(readItem, this.followeeHandleAttr),
    };
  }

  public async getPageOfFollowees(
    followerHandle: string,
    pageSize: number,
    lastFolloweeHandle?: string,
  ): Promise<DataPage<FollowRelation>> {
    return this.queryPage({
      KeyConditionExpression: `${this.followerHandleAttr} = :handle`,
      ExpressionAttributeValues: {
        ":handle": followerHandle,
      },
      Limit: pageSize,
      ...(lastFolloweeHandle === undefined
        ? {}
        : {
            ExclusiveStartKey: {
              [this.followerHandleAttr]: followerHandle,
              [this.followeeHandleAttr]: lastFolloweeHandle,
            },
          }),
    });
  }

  public async getPageOfFollowers(
    followeeHandle: string,
    pageSize: number,
    lastFollowerHandle?: string,
  ): Promise<DataPage<FollowRelation>> {
    return this.queryPage({
      KeyConditionExpression: `${this.followeeHandleAttr} = :handle`,
      ExpressionAttributeValues: {
        ":handle": followeeHandle,
      },
      IndexName: this.indexName,
      Limit: pageSize,
      ...(lastFollowerHandle === undefined
        ? {}
        : {
            ExclusiveStartKey: {
              [this.followerHandleAttr]: lastFollowerHandle,
              [this.followeeHandleAttr]: followeeHandle,
            },
          }),
    });
  }

  private readString(
    readItem: Record<string, unknown>,
    attributeName: string,
  ): string {
    const value = readItem[attributeName];
    if (typeof value !== "string") {
      throw new Error(`Missing string attribute '${attributeName}'`);
    }

    return value;
  }
}
