// Partially written by AI.
import type { FollowDao } from "./FollowDao";
import type { UserDao } from "./UserDao";

export interface DaoFactory {
  getFollowDao(): FollowDao;
  getUserDao(): UserDao;
}
