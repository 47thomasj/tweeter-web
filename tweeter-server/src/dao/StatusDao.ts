// Partially written by AI.
import type { StatusDto } from "tweeter-shared";
import type { Dao } from "./Dao";
import type { DataPage } from "./DataPage";

export interface StatusDao
  extends Dao<
    StatusDto,
    [userAlias: string, timestamp: number]
  >
{
  getPageOfStoryItems(
    userAlias: string,
    pageSize: number,
    lastTimestamp?: number,
  ): Promise<DataPage<StatusDto>>;
}
