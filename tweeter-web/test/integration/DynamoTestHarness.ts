// Partially written by AI.

import {
  DescribeTableCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  type GetCommandInput,
  PutCommand,
  type PutCommandInput,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  GetCallerIdentityCommand,
  STSClient,
} from "@aws-sdk/client-sts";
import bcrypt from "bcryptjs";
import {
  AuthToken,
  type StatusDto,
  type UserDto,
} from "tweeter-shared";

export const INTEGRATION_REGION = "us-east-2";
export const INTEGRATION_ACCOUNT_ID = "727728513382";

export const INTEGRATION_TABLES = {
  users: "users",
  auth: "auth",
  sessions: "sessions",
  follows: "follows",
  statuses: "statuses",
  feed: "feed",
} as const;

type IntegrationTableName =
  (typeof INTEGRATION_TABLES)[keyof typeof INTEGRATION_TABLES];
type DynamoItem = NonNullable<PutCommandInput["Item"]>;
type DynamoKey = NonNullable<GetCommandInput["Key"]>;

interface CleanupEntry {
  readonly tableName: IntegrationTableName;
  readonly key: DynamoKey;
}

let preflightPromise: Promise<void> | undefined;

export class DynamoTestHarness {
  private readonly client: DynamoDBDocumentClient;
  private readonly cleanupEntries = new Map<string, CleanupEntry>();
  private readonly aliasPrefix: string;

  private constructor(public readonly runId: string) {
    const lowLevelClient = new DynamoDBClient({
      region: INTEGRATION_REGION,
      maxAttempts: 5,
    });
    this.client = DynamoDBDocumentClient.from(lowLevelClient, {
      marshallOptions: { removeUndefinedValues: true },
    });
    this.aliasPrefix = `@integration-${runId}-`;
  }

  public static async create(suiteName: string): Promise<DynamoTestHarness> {
    preflightPromise ??= DynamoTestHarness.verifyEnvironment();
    await preflightPromise;

    const uniqueSuffix = Math.random().toString(36).slice(2, 10);
    return new DynamoTestHarness(
      `${suiteName}-${Date.now().toString(36)}-${uniqueSuffix}`,
    );
  }

  public alias(label: string): string {
    return `${this.aliasPrefix}${label}`;
  }

  public makeUser(
    label: string,
    overrides: Partial<UserDto> = {},
  ): UserDto {
    return {
      firstName: "Integration",
      lastName: label,
      alias: this.alias(label),
      imageUrl: "aW50ZWdyYXRpb24=",
      ...overrides,
    };
  }

  public async seedUser(user: UserDto): Promise<void> {
    this.assertOwnedAlias(user.alias);
    await this.putOwnedItem(
      INTEGRATION_TABLES.users,
      {
        alias: user.alias,
        first_name: user.firstName,
        last_name: user.lastName,
        image_url: user.imageUrl,
      },
      { alias: user.alias },
    );
  }

  public async seedCredentials(
    alias: string,
    password: string,
  ): Promise<void> {
    this.assertOwnedAlias(alias);
    const passwordHash = await bcrypt.hash(password, 10);
    await this.putOwnedItem(
      INTEGRATION_TABLES.auth,
      {
        alias,
        password_hash: passwordHash,
      },
      { alias },
    );
  }

  public async seedSession(
    userAlias: string,
    label: string,
  ): Promise<AuthToken> {
    this.assertOwnedAlias(userAlias);
    const timestamp = Date.now();
    const token = `integration-${this.runId}-${label}`;
    await this.putOwnedItem(
      INTEGRATION_TABLES.sessions,
      {
        token,
        timestamp,
        user_alias: userAlias,
        expires_at: Math.floor(timestamp / 1000) + 30 * 60,
      },
      { token },
    );
    return new AuthToken(token, timestamp);
  }

  public async seedFollow(
    followerAlias: string,
    followeeAlias: string,
  ): Promise<void> {
    this.assertOwnedAlias(followerAlias);
    this.assertOwnedAlias(followeeAlias);
    await this.putOwnedItem(
      INTEGRATION_TABLES.follows,
      {
        follower_handle: followerAlias,
        followee_handle: followeeAlias,
      },
      {
        follower_handle: followerAlias,
        followee_handle: followeeAlias,
      },
    );
  }

  public async seedStatus(status: StatusDto): Promise<void> {
    this.assertOwnedAlias(status.user.alias);
    await this.putOwnedItem(
      INTEGRATION_TABLES.statuses,
      {
        user_alias: status.user.alias,
        timestamp: status.timestamp,
        post: status.post,
        user: { ...status.user },
        segments: status.segments.map((segment) => ({ ...segment })),
      },
      {
        user_alias: status.user.alias,
        timestamp: status.timestamp,
      },
    );
  }

  public async seedFeedReference(
    feedUserAlias: string,
    statusUserAlias: string,
    timestamp: number,
  ): Promise<void> {
    this.assertOwnedAlias(feedUserAlias);
    this.assertOwnedAlias(statusUserAlias);
    await this.putOwnedItem(
      INTEGRATION_TABLES.feed,
      {
        feed_user_alias: feedUserAlias,
        status_user_alias: statusUserAlias,
        timestamp,
      },
      {
        feed_user_alias: feedUserAlias,
        timestamp,
      },
    );
  }

  public async seedMalformedCredentials(alias: string): Promise<void> {
    this.assertOwnedAlias(alias);
    await this.putOwnedItem(
      INTEGRATION_TABLES.auth,
      { alias },
      { alias },
    );
  }

  public async seedMalformedUser(alias: string): Promise<void> {
    this.assertOwnedAlias(alias);
    await this.putOwnedItem(
      INTEGRATION_TABLES.users,
      { alias },
      { alias },
    );
  }

  public async seedMalformedStatus(
    userAlias: string,
    timestamp: number,
  ): Promise<void> {
    this.assertOwnedAlias(userAlias);
    await this.putOwnedItem(
      INTEGRATION_TABLES.statuses,
      { user_alias: userAlias, timestamp },
      { user_alias: userAlias, timestamp },
    );
  }

  public trackApiRegistration(alias: string): void {
    this.assertOwnedAlias(alias);
    this.trackCleanup(INTEGRATION_TABLES.users, { alias });
    this.trackCleanup(INTEGRATION_TABLES.auth, { alias });
  }

  public trackSession(token: string, ownerAlias: string): void {
    this.assertOwnedAlias(ownerAlias);
    this.trackCleanup(INTEGRATION_TABLES.sessions, { token });
  }

  public async getUser(alias: string): Promise<DynamoItem | undefined> {
    this.assertOwnedAlias(alias);
    return this.getItem(INTEGRATION_TABLES.users, { alias });
  }

  public async getCredentials(
    alias: string,
  ): Promise<DynamoItem | undefined> {
    this.assertOwnedAlias(alias);
    return this.getItem(INTEGRATION_TABLES.auth, { alias });
  }

  public async getSession(token: string): Promise<DynamoItem | undefined> {
    return this.getItem(INTEGRATION_TABLES.sessions, { token });
  }

  public async getStatus(
    userAlias: string,
    timestamp: number,
  ): Promise<DynamoItem | undefined> {
    this.assertOwnedAlias(userAlias);
    return this.getItem(INTEGRATION_TABLES.statuses, {
      user_alias: userAlias,
      timestamp,
    });
  }

  public async waitForFollowerIndex(
    followerAlias: string,
    followeeAlias: string,
  ): Promise<void> {
    this.assertOwnedAlias(followerAlias);
    this.assertOwnedAlias(followeeAlias);

    await this.waitFor(async () => {
      const output = await this.client.send(
        new QueryCommand({
          TableName: INTEGRATION_TABLES.follows,
          IndexName: "follows_index",
          KeyConditionExpression: "followee_handle = :followee",
          ExpressionAttributeValues: {
            ":followee": followeeAlias,
          },
        }),
      );
      return (output.Items ?? []).some(
        (item) => item.follower_handle === followerAlias,
      );
    }, `follow index entry '${followerAlias}' -> '${followeeAlias}'`);
  }

  public async cleanup(): Promise<void> {
    const entries = [...this.cleanupEntries.values()].reverse();
    const failures: string[] = [];

    for (const entry of entries) {
      try {
        await this.client.send(
          new DeleteCommand({
            TableName: entry.tableName,
            Key: entry.key,
          }),
        );
      } catch (error) {
        failures.push(
          `delete ${entry.tableName}:${JSON.stringify(entry.key)}: ${String(error)}`,
        );
      }
    }

    for (const entry of entries) {
      try {
        const remainingItem = await this.getItem(
          entry.tableName,
          entry.key,
        );
        if (remainingItem !== undefined) {
          failures.push(
            `item remained in ${entry.tableName}:${JSON.stringify(entry.key)}`,
          );
        }
      } catch (error) {
        failures.push(
          `verify ${entry.tableName}:${JSON.stringify(entry.key)}: ${String(error)}`,
        );
      }
    }

    this.client.destroy();

    if (failures.length > 0) {
      throw new Error(`Integration cleanup failed:\n${failures.join("\n")}`);
    }
  }

  private async putOwnedItem(
    tableName: IntegrationTableName,
    item: DynamoItem,
    key: DynamoKey,
  ): Promise<void> {
    this.trackCleanup(tableName, key);
    await this.client.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      }),
    );
  }

  private async getItem(
    tableName: IntegrationTableName,
    key: DynamoKey,
  ): Promise<DynamoItem | undefined> {
    const output = await this.client.send(
      new GetCommand({
        TableName: tableName,
        Key: key,
        ConsistentRead: true,
      }),
    );
    return output.Item;
  }

  private trackCleanup(
    tableName: IntegrationTableName,
    key: DynamoKey,
  ): void {
    const cleanupKey = `${tableName}:${JSON.stringify(key)}`;
    this.cleanupEntries.set(cleanupKey, { tableName, key });
  }

  private assertOwnedAlias(alias: string): void {
    if (!alias.startsWith(this.aliasPrefix)) {
      throw new Error(
        `Refusing to mutate non-test alias '${alias}' for run '${this.runId}'`,
      );
    }
  }

  private async waitFor(
    condition: () => Promise<boolean>,
    description: string,
  ): Promise<void> {
    const delays = [50, 100, 200, 400, 800, 1_600];
    for (const delay of delays) {
      if (await condition()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    if (await condition()) {
      return;
    }
    throw new Error(`Timed out waiting for ${description}`);
  }

  private static async verifyEnvironment(): Promise<void> {
    const stsClient = new STSClient({ region: INTEGRATION_REGION });
    const dynamoClient = new DynamoDBClient({
      region: INTEGRATION_REGION,
    });

    try {
      const identity = await stsClient.send(
        new GetCallerIdentityCommand({}),
      );
      if (identity.Account !== INTEGRATION_ACCOUNT_ID) {
        throw new Error(
          `Integration tests require AWS account '${INTEGRATION_ACCOUNT_ID}', received '${identity.Account ?? "unknown"}'`,
        );
      }

      await Promise.all(
        Object.values(INTEGRATION_TABLES).map(async (tableName) => {
          const output = await dynamoClient.send(
            new DescribeTableCommand({ TableName: tableName }),
          );
          const expectedArn =
            `arn:aws:dynamodb:${INTEGRATION_REGION}:` +
            `${INTEGRATION_ACCOUNT_ID}:table/${tableName}`;
          if (
            output.Table?.TableStatus !== "ACTIVE" ||
            output.Table.TableArn !== expectedArn
          ) {
            throw new Error(
              `Integration table '${tableName}' is not the expected active dev table`,
            );
          }
        }),
      );
    } finally {
      stsClient.destroy();
      dynamoClient.destroy();
    }
  }
}
