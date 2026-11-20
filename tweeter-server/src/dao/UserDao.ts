// Partially written by AI.
import type { UserDto } from "tweeter-shared";
import type { Dao } from "./Dao";

export type UserWithoutImage = Omit<UserDto, "imageUrl">;

export interface UserDao extends Dao<UserDto, [alias: string]> {
  createUser(
    user: UserWithoutImage,
    imageBytes: Uint8Array,
    imageFileExtension: string,
  ): Promise<UserDto>;
  getBatchUsers(
    aliases: readonly string[],
  ): Promise<ReadonlyMap<string, UserDto>>;
}
