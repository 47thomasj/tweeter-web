// Partially written by AI.
import type { AuthTokenDto } from "tweeter-shared";
import type { Dao } from "./Dao";

export interface SessionDao
  extends Dao<AuthTokenDto, [token: string]> {}
