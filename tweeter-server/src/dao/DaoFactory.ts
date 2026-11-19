// Partially written by AI.
import type { FeedDao } from "./FeedDao";
import type { FollowDao } from "./FollowDao";
import type { StatusDao } from "./StatusDao";
import type { UserDao } from "./UserDao";

export interface DaoFactory {
  getFeedDao(): FeedDao;
  getFollowDao(): FollowDao;
  getStatusDao(): StatusDao;
  getUserDao(): UserDao;
}
