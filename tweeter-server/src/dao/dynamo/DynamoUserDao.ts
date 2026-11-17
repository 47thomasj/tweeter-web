// Partially written by AI.
import {
  BatchGetCommand,
  type BatchGetCommandInput,
  type BatchGetCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import type { UserDto } from "tweeter-shared";
import type { UserDao } from "../UserDao";
import { DynamoDao } from "./DynamoDao";

type BatchKeys = NonNullable<
  NonNullable<BatchGetCommandInput["RequestItems"]>[string]["Keys"]
>;

export class DynamoUserDao
  extends DynamoDao<UserDto, [alias: string]>
  implements UserDao
{
  private static readonly maxBatchSize = 100;
  private static readonly maxBatchAttempts = 5;

  private readonly aliasAttr = "alias";
  private readonly firstNameAttr = "first_name";
  private readonly lastNameAttr = "last_name";
  private readonly imageUrlAttr = "image_url";

  protected mapItem(user: UserDto): Record<string, string> {
    return {
      [this.aliasAttr]: user.alias,
      [this.firstNameAttr]: user.firstName,
      [this.lastNameAttr]: user.lastName,
      [this.imageUrlAttr]: user.imageUrl,
    };
  }

  protected produceKey(alias: string) {
    return {
      [this.aliasAttr]: alias,
    };
  }

  protected produceItemFromReadItem(
    readItem: Record<string, unknown>,
  ): UserDto {
    return {
      alias: this.readString(readItem, this.aliasAttr),
      firstName: this.readString(readItem, this.firstNameAttr),
      lastName: this.readString(readItem, this.lastNameAttr),
      imageUrl: this.readString(readItem, this.imageUrlAttr),
    };
  }

  public async getBatchUsers(
    aliases: readonly string[],
  ): Promise<ReadonlyMap<string, UserDto>> {
    const users = new Map<string, UserDto>();
    const uniqueAliases = [...new Set(aliases)];

    for (
      let start = 0;
      start < uniqueAliases.length;
      start += DynamoUserDao.maxBatchSize
    ) {
      const batch = uniqueAliases.slice(
        start,
        start + DynamoUserDao.maxBatchSize,
      );
      await this.loadBatch(batch, users);
    }

    return users;
  }

  private async loadBatch(
    aliases: readonly string[],
    users: Map<string, UserDto>,
  ): Promise<void> {
    let pendingKeys: BatchKeys = aliases.map((alias) =>
      this.produceKey(alias),
    );
    let attempt = 0;

    while (pendingKeys.length > 0) {
      if (attempt >= DynamoUserDao.maxBatchAttempts) {
        throw new Error("DynamoDB did not process all requested users");
      }

      const output: BatchGetCommandOutput = await this.client.send(
        new BatchGetCommand({
          RequestItems: {
            [this.tableName]: {
              Keys: pendingKeys,
            },
          },
        }),
      );

      for (const readItem of output.Responses?.[this.tableName] ?? []) {
        const user = this.produceItemFromReadItem(readItem);
        users.set(user.alias, user);
      }

      pendingKeys =
        output.UnprocessedKeys?.[this.tableName]?.Keys ?? [];
      if (pendingKeys.length > 0) {
        await this.waitBeforeRetry(attempt);
      }
      attempt += 1;
    }
  }

  private async waitBeforeRetry(attempt: number): Promise<void> {
    const delayMilliseconds = 25 * 2 ** attempt;
    await new Promise((resolve) =>
      setTimeout(resolve, delayMilliseconds),
    );
  }

  private readString(
    readItem: Record<string, unknown>,
    attributeName: string,
  ): string {
    const value = readItem[attributeName];
    if (typeof value !== "string") {
      throw new Error(`Missing string attribute '${attributeName}'`);
    }

    return value;
  }
}
