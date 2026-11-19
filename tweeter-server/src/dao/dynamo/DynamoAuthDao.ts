// Partially written by AI.
import type { AuthDao, Credentials, CredentialsKey } from "../AuthDao";
import { DynamoDao } from "./DynamoDao";

export class DynamoAuthDao
  extends DynamoDao<Credentials, CredentialsKey>
  implements AuthDao
{
  private readonly aliasAttr = "alias";
  private readonly passwordHashAttr = "password_hash";

  protected mapItem(credentials: Credentials): Record<string, string> {
    return {
      [this.aliasAttr]: credentials.alias,
      [this.passwordHashAttr]: credentials.passwordHash,
    };
  }

  protected produceKey(alias: string): Record<string, string> {
    return {
      [this.aliasAttr]: alias,
    };
  }

  protected produceItemFromReadItem(
    readItem: Record<string, unknown>,
  ): Credentials {
    return {
      alias: this.readString(readItem, this.aliasAttr),
      passwordHash: this.readString(readItem, this.passwordHashAttr),
    };
  }

  public async getPasswordHash(alias: string): Promise<string | undefined> {
    return (await this.getItem(alias))?.passwordHash;
  }
}
