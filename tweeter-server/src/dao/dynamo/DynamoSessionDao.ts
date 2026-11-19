// Partially written by AI.
import type { AuthTokenDto } from "tweeter-shared";
import type { SessionDao } from "../SessionDao";
import { DynamoDao } from "./DynamoDao";

export class DynamoSessionDao
  extends DynamoDao<AuthTokenDto, [token: string]>
  implements SessionDao
{
  private static readonly tokenLifetimeMilliseconds = 30 * 60 * 1000;

  private readonly tokenAttr = "token";
  private readonly timestampAttr = "timestamp";
  private readonly expiresAtAttr = "expires_at";

  public constructor(tokensTableName: string) {
    super(tokensTableName);
  }

  protected mapItem(authToken: AuthTokenDto): Record<string, string | number> {
    return {
      [this.tokenAttr]: authToken.token,
      [this.timestampAttr]: authToken.timestamp,
      [this.expiresAtAttr]: Math.floor(
        (authToken.timestamp + DynamoSessionDao.tokenLifetimeMilliseconds) /
          1000,
      ),
    };
  }

  protected produceKey(token: string): Record<string, string> {
    return {
      [this.tokenAttr]: token,
    };
  }

  protected produceItemFromReadItem(
    readItem: Record<string, unknown>,
  ): AuthTokenDto {
    return {
      token: this.readString(readItem, this.tokenAttr),
      timestamp: this.readNumber(readItem, this.timestampAttr),
    };
  }
}
