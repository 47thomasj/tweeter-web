// Partially written by AI.
import type { PutCommandInput } from "@aws-sdk/lib-dynamodb";
import type { DataPage } from "../DataPage";
import type { FeedDao, FeedItem, FeedItemKey } from "../FeedDao";
import { DynamoDao } from "./DynamoDao";

export class DynamoFeedDao
  extends DynamoDao<
    FeedItem,
    [
      feedUserAlias: string,
      statusUserAlias: string,
      timestamp: number,
    ]
  >
  implements FeedDao
{
  private readonly feedUserAliasAttr = "feed_user_alias";
  private readonly sortKeyAttr = "sort_key";
  private readonly statusUserAliasAttr = "status_user_alias";
  private readonly timestampAttr = "timestamp";

  protected mapItem(item: FeedItem): NonNullable<PutCommandInput["Item"]> {
    return {
      [this.feedUserAliasAttr]: item.feedUserAlias,
      [this.sortKeyAttr]: this.makeSortKey(
        item.timestamp,
        item.statusUserAlias,
      ),
      [this.statusUserAliasAttr]: item.statusUserAlias,
      [this.timestampAttr]: item.timestamp,
    };
  }

  protected produceKey(
    feedUserAlias: string,
    statusUserAlias: string,
    timestamp: number,
  ) {
    return {
      [this.feedUserAliasAttr]: feedUserAlias,
      [this.sortKeyAttr]: this.makeSortKey(timestamp, statusUserAlias),
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

  public putBatchFeedItems(items: readonly FeedItem[]): Promise<void> {
    return this.batchPutItems(items);
  }

  public async getPageOfFeedItems(
    feedUserAlias: string,
    pageSize: number,
    lastItem?: FeedItemKey,
  ): Promise<DataPage<FeedItem>> {
    return this.queryPage({
      KeyConditionExpression: `${this.feedUserAliasAttr} = :feedUserAlias`,
      ExpressionAttributeValues: {
        ":feedUserAlias": feedUserAlias,
      },
      Limit: pageSize,
      ScanIndexForward: false,
      ...(lastItem === undefined
        ? {}
        : {
            ExclusiveStartKey: {
              [this.feedUserAliasAttr]: feedUserAlias,
              [this.sortKeyAttr]: this.makeSortKey(
                lastItem.timestamp,
                lastItem.statusUserAlias,
              ),
            },
          }),
    });
  }

  private makeSortKey(timestamp: number, statusUserAlias: string): string {
    return `${timestamp.toString().padStart(16, "0")}#${statusUserAlias}`;
  }
}
