// Partially written by AI.
import type { PutCommandInput } from "@aws-sdk/lib-dynamodb";
import type { DataPage } from "../DataPage";
import type { FeedDao, FeedItem } from "../FeedDao";
import { DynamoDao } from "./DynamoDao";

export class DynamoFeedDao
  extends DynamoDao<FeedItem, [feedUserAlias: string, timestamp: number]>
  implements FeedDao
{
  private readonly feedUserAliasAttr = "feed_user_alias";
  private readonly statusUserAliasAttr = "status_user_alias";
  private readonly timestampAttr = "timestamp";

  protected mapItem(item: FeedItem): NonNullable<PutCommandInput["Item"]> {
    return {
      [this.feedUserAliasAttr]: item.feedUserAlias,
      [this.statusUserAliasAttr]: item.statusUserAlias,
      [this.timestampAttr]: item.timestamp,
    };
  }

  protected produceKey(feedUserAlias: string, timestamp: number) {
    return {
      [this.feedUserAliasAttr]: feedUserAlias,
      [this.timestampAttr]: timestamp,
    };
  }

  protected produceItemFromReadItem(
    readItem: Record<string, unknown>,
  ): FeedItem {
    return {
      feedUserAlias: this.readString(readItem, this.feedUserAliasAttr),
      statusUserAlias: this.readString(readItem, this.statusUserAliasAttr),
      timestamp: this.readNumber(readItem, this.timestampAttr),
    };
  }

  public async getPageOfFeedItems(
    feedUserAlias: string,
    pageSize: number,
    lastTimestamp?: number,
  ): Promise<DataPage<FeedItem>> {
    return this.queryPage({
      KeyConditionExpression: `${this.feedUserAliasAttr} = :feedUserAlias`,
      ExpressionAttributeValues: {
        ":feedUserAlias": feedUserAlias,
      },
      Limit: pageSize,
      ScanIndexForward: false,
      ...(lastTimestamp === undefined
        ? {}
        : {
            ExclusiveStartKey: {
              [this.feedUserAliasAttr]: feedUserAlias,
              [this.timestampAttr]: lastTimestamp,
            },
          }),
    });
  }
}
