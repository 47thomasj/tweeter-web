// Partially written by AI.
import type { FollowDao } from "./FollowDao";
import type { StatusDao } from "./StatusDao";
import type { UserDao } from "./UserDao";

export interface DaoFactory {
  getFollowDao(): FollowDao;
  getStatusDao(): StatusDao;
  getUserDao(): UserDao;
}
