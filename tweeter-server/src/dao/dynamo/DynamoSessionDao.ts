// Partially written by AI.
import type { SessionDao } from "../SessionDao";
import { DynamoDao } from "./DynamoDao";
import type { SessionDto } from "../SessionDao";

export class DynamoSessionDao
  extends DynamoDao<SessionDto, [token: string]>
  implements SessionDao
{
  private readonly tokenAttr = "token";
  private readonly timestampAttr = "timestamp";
  private readonly userAliasAttr = "user_alias";
  private readonly expiresAtAttr = "expires_at";

  public constructor(tokensTableName: string) {
    super(tokensTableName);
  }

  protected mapItem(session: SessionDto): Record<string, string | number> {
    return {
      [this.tokenAttr]: session.token,
      [this.timestampAttr]: session.timestamp,
      [this.userAliasAttr]: session.userAlias,
      [this.expiresAtAttr]: session.expiresAt,
    };
  }

  protected produceKey(token: string): Record<string, string> {
    return {
      [this.tokenAttr]: token,
    };
  }

  protected produceItemFromReadItem(
    readItem: Record<string, unknown>,
  ): SessionDto {
    return {
      token: this.readString(readItem, this.tokenAttr),
      timestamp: this.readNumber(readItem, this.timestampAttr),
      userAlias: this.readString(readItem, this.userAliasAttr),
      expiresAt: this.readNumber(readItem, this.expiresAtAttr),
    };
  }
}
