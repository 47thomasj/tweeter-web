// Partially written by AI.
import type { Dao } from "./Dao";

export interface Credentials {
  alias: string;
  passwordHash: string;
}

export type CredentialsKey = [alias: string];

export interface AuthDao extends Dao<Credentials, CredentialsKey> {
  getPasswordHash(alias: string): Promise<string | undefined>;
}
