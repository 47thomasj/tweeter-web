// Partially written by AI.
import type { StatusDto } from "tweeter-shared";
import type { Dao } from "./Dao";
import type { DataPage } from "./DataPage";

export interface StatusKey {
  userAlias: string;
  timestamp: number;
}

export interface StatusDao extends Dao<
  StatusDto,
  [userAlias: string, timestamp: number]
> {
  getBatchStatuses(
    keys: readonly StatusKey[],
  ): Promise<ReadonlyArray<StatusDto | undefined>>;

  getPageOfStoryItems(
    userAlias: string,
    pageSize: number,
    lastTimestamp?: number,
  ): Promise<DataPage<StatusDto>>;
}
