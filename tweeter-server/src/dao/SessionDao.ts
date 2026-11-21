// Partially written by AI.
import type { AuthTokenDto } from "tweeter-shared";
import type { Dao } from "./Dao";

export interface SessionDto extends AuthTokenDto {
    userAlias: string;
    expiresAt: number;
}

export const SESSION_LIFETIME_SECONDS = 30 * 60;
export interface SessionDao extends Dao<SessionDto, [token: string]> {}
