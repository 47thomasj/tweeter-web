// Partially written by AI.
import type { UserDto } from "tweeter-shared";

export interface DataPage<T> {
  items: T[];
  hasMore: boolean;
}

export type UserPage = [items: UserDto[], hasMore: boolean];
