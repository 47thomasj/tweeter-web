// Partially written by AI.
import type { Dao } from "./Dao";
import type { DataPage } from "./DataPage";

export interface FeedItem {
  feedUserAlias: string;
  statusUserAlias: string;
  timestamp: number;
}

export interface FeedDao extends Dao<
  FeedItem,
  [feedUserAlias: string, timestamp: number]
> {
  putBatchFeedItems(items: readonly FeedItem[]): Promise<void>;

  getPageOfFeedItems(
    feedUserAlias: string,
    pageSize: number,
    lastTimestamp?: number,
  ): Promise<DataPage<FeedItem>>;
}
