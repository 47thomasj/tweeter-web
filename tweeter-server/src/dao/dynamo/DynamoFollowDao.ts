// Partially written by AI.
import { Follow, User } from "tweeter-shared";
import type { UserPage } from "../DataPage";
import type { FollowDao } from "../FollowDao";
import { DynamoDao } from "./DynamoDao";

export class DynamoFollowDao
  extends DynamoDao<Follow, [string, string]>
  implements FollowDao
{
  private readonly followerHandleAttr = "follower_handle";
  private readonly followerFirstNameAttr = "follower_first_name";
  private readonly followerLastNameAttr = "follower_last_name";
  private readonly followerImageUrlAttr = "follower_image_url";
  private readonly followeeHandleAttr = "followee_handle";
  private readonly followeeFirstNameAttr = "followee_first_name";
  private readonly followeeLastNameAttr = "followee_last_name";
  private readonly followeeImageUrlAttr = "followee_image_url";

  public constructor(
    tableName: string,
    private readonly indexName = "follows_index",
  ) {
    super(tableName);
  }

  protected mapItem(follow: Follow): Record<string, string> {
    return {
      [this.followerHandleAttr]: follow.follower.alias,
      [this.followerFirstNameAttr]: follow.follower.firstName,
      [this.followerLastNameAttr]: follow.follower.lastName,
      [this.followerImageUrlAttr]: follow.follower.imageUrl,
      [this.followeeHandleAttr]: follow.followee.alias,
      [this.followeeFirstNameAttr]: follow.followee.firstName,
      [this.followeeLastNameAttr]: follow.followee.lastName,
      [this.followeeImageUrlAttr]: follow.followee.imageUrl,
    };
  }

  protected produceKey(followerHandle: string, followeeHandle: string) {
    return {
      [this.followerHandleAttr]: followerHandle,
      [this.followeeHandleAttr]: followeeHandle,
    };
  }

  protected produceItemFromReadItem(readItem: Record<string, unknown>): Follow {
    return new Follow(
      new User(
        this.readString(readItem, this.followerFirstNameAttr),
        this.readString(readItem, this.followerLastNameAttr),
        this.readString(readItem, this.followerHandleAttr),
        this.readString(readItem, this.followerImageUrlAttr),
      ),
      new User(
        this.readString(readItem, this.followeeFirstNameAttr),
        this.readString(readItem, this.followeeLastNameAttr),
        this.readString(readItem, this.followeeHandleAttr),
        this.readString(readItem, this.followeeImageUrlAttr),
      ),
    );
  }

  public async getPageOfFollowees(
    followerHandle: string,
    pageSize: number,
    lastFolloweeHandle?: string,
  ): Promise<UserPage> {
    const page = await this.queryPage({
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

    return [page.items.map((follow) => follow.followee.dto), page.hasMore];
  }

  public async getPageOfFollowers(
    followeeHandle: string,
    pageSize: number,
    lastFollowerHandle?: string,
  ): Promise<UserPage> {
    const page = await this.queryPage({
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

    return [page.items.map((follow) => follow.follower.dto), page.hasMore];
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
