// Partially written by AI.
import type { UserPage } from "./DataPage";

export interface FollowDao {
  getPageOfFollowees(
    followerHandle: string,
    pageSize: number,
    lastFolloweeHandle?: string,
  ): Promise<UserPage>;

  getPageOfFollowers(
    followeeHandle: string,
    pageSize: number,
    lastFollowerHandle?: string,
  ): Promise<UserPage>;
}
