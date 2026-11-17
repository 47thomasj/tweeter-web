// Partially written by AI.
import type { UserDto } from "tweeter-shared";
import type { Dao } from "./Dao";

export interface UserDao extends Dao<UserDto, [alias: string]> {}
