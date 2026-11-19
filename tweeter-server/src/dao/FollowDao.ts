// Partially written by AI.
import type { Dao } from "./Dao";
import type { DataPage } from "./DataPage";

export interface FollowRelation {
  followerHandle: string;
  followeeHandle: string;
}

export interface FollowDao extends Dao<
  FollowRelation,
  [followerHandle: string, followeeHandle: string]
> {
  getPageOfFollowees(
    followerHandle: string,
    pageSize: number,
    lastFolloweeHandle?: string,
  ): Promise<DataPage<FollowRelation>>;

  getPageOfFollowers(
    followeeHandle: string,
    pageSize: number,
    lastFollowerHandle?: string,
  ): Promise<DataPage<FollowRelation>>;
}
