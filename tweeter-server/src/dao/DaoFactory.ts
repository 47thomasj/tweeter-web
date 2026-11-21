// Partially written by AI.
import type { AuthDao } from "./AuthDao";
import type { FeedDao } from "./FeedDao";
import type { FollowDao } from "./FollowDao";
import type { ImageDao } from "./ImageDao";
import type { SessionDao } from "./SessionDao";
import type { StatusDao } from "./StatusDao";
import type { UserDao } from "./UserDao";

export interface DaoFactory {
  getAuthDao(): AuthDao;
  getFeedDao(): FeedDao;
  getFollowDao(): FollowDao;
  getImageDao(): ImageDao;
  getSessionDao(): SessionDao;
  getStatusDao(): StatusDao;
  getUserDao(): UserDao;
}
