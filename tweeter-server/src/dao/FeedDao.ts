// Partially written by AI.
import type { Dao } from "./Dao";
import type { DataPage } from "./DataPage";

export interface FeedItem {
  feedUserAlias: string;
  statusUserAlias: string;
  timestamp: number;
}

export type FeedItemKey = Pick<FeedItem, "statusUserAlias" | "timestamp">;

export interface FeedDao extends Dao<
  FeedItem,
  [
    feedUserAlias: string,
    statusUserAlias: string,
    timestamp: number,
  ]
> {
  putBatchFeedItems(items: readonly FeedItem[]): Promise<void>;

  getPageOfFeedItems(
    feedUserAlias: string,
    pageSize: number,
    lastItem?: FeedItemKey,
  ): Promise<DataPage<FeedItem>>;
}
