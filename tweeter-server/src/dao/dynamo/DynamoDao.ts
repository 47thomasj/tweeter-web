// Partially written by AI.
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchGetCommand,
  type BatchGetCommandInput,
  type BatchGetCommandOutput,
  BatchWriteCommand,
  type BatchWriteCommandInput,
  type BatchWriteCommandOutput,
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  type GetCommandInput,
  PutCommand,
  type PutCommandInput,
  QueryCommand,
  type QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import type { Dao } from "../Dao";
import type { DataPage } from "../DataPage";

type BatchKeys = NonNullable<
  NonNullable<BatchGetCommandInput["RequestItems"]>[string]["Keys"]
>;
type BatchWrites = NonNullable<
  NonNullable<BatchWriteCommandInput["RequestItems"]>[string]
>;

export abstract class DynamoDao<T, KeyArgs extends unknown[]> implements Dao<
  T,
  KeyArgs
> {
  private static readonly maxBatchSize = 100;
  private static readonly maxBatchWriteSize = 25;
  private static readonly maxBatchAttempts = 5;

  protected readonly tableName: string;
  protected readonly client = DynamoDBDocumentClient.from(new DynamoDBClient());

  public constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Converts a known item into an "Item" map that can be used to put items to the table.
   * @param item.
   */
  protected abstract mapItem(item: T): NonNullable<PutCommandInput["Item"]>;

  /**
   * Returns the key of the item to be used to get the item from the table.
   * @param args.
   */
  protected abstract produceKey(...args: KeyArgs): GetCommandInput["Key"];

  /**
   * Converts a raw read item into a known item.
   * @param readItem.
   */
  protected abstract produceItemFromReadItem(
    readItem: Record<string, unknown>,
  ): T;

  public async putItem(item: T): Promise<void> {
    const params = {
      TableName: this.tableName,
      Item: this.mapItem(item),
    };
    await this.client.send(new PutCommand(params));
  }

  public async getItem(...args: KeyArgs): Promise<T | undefined> {
    const params = {
      TableName: this.tableName,
      Key: this.produceKey(...args),
      ConsistentRead: true,
    };

    const output = await this.client.send(new GetCommand(params));
    return output.Item === undefined
      ? undefined
      : this.produceItemFromReadItem(output.Item);
  }

  public async deleteItem(...args: KeyArgs): Promise<void> {
    const params = {
      TableName: this.tableName,
      Key: this.produceKey(...args),
    };
    await this.client.send(new DeleteCommand(params));
  }

  protected async queryPage(
    params: Omit<QueryCommandInput, "TableName">,
  ): Promise<DataPage<T>> {
    const output = await this.client.send(
      new QueryCommand({
        ...params,
        TableName: this.tableName,
      }),
    );

    return {
      items: (output.Items ?? []).map((item) =>
        this.produceItemFromReadItem(item),
      ),
      hasMore: output.LastEvaluatedKey !== undefined,
    };
  }

  protected async batchGetItems(
    keyArguments: readonly KeyArgs[],
  ): Promise<T[]> {
    const uniqueKeys = new Map<string, BatchKeys[number]>();
    for (const args of keyArguments) {
      const key = this.produceKey(...args);
      if (key === undefined) {
        throw new Error(
          `Could not produce a DynamoDB key for '${this.tableName}'`,
        );
      }
      uniqueKeys.set(JSON.stringify(key), key);
    }

    const keys = [...uniqueKeys.values()];
    const items: T[] = [];
    for (let start = 0; start < keys.length; start += DynamoDao.maxBatchSize) {
      await this.loadBatch(
        keys.slice(start, start + DynamoDao.maxBatchSize),
        items,
      );
    }

    return items;
  }

  protected async batchPutItems(items: readonly T[]): Promise<void> {
    for (
      let start = 0;
      start < items.length;
      start += DynamoDao.maxBatchWriteSize
    ) {
      const writes: BatchWrites = items
        .slice(start, start + DynamoDao.maxBatchWriteSize)
        .map((item) => ({
          PutRequest: {
            Item: this.mapItem(item),
          },
        }));
      await this.writeBatch(writes);
    }
  }

  private async loadBatch(keys: BatchKeys, items: T[]): Promise<void> {
    let pendingKeys = keys;
    let attempt = 0;

    while (pendingKeys.length > 0) {
      if (attempt >= DynamoDao.maxBatchAttempts) {
        throw new Error(
          `DynamoDB did not process all batch keys for '${this.tableName}'`,
        );
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
        items.push(this.produceItemFromReadItem(readItem));
      }

      pendingKeys = output.UnprocessedKeys?.[this.tableName]?.Keys ?? [];
      if (pendingKeys.length > 0) {
        await this.waitBeforeBatchRetry(attempt);
      }
      attempt += 1;
    }
  }

  private async writeBatch(writes: BatchWrites): Promise<void> {
    let pendingWrites = writes;
    let attempt = 0;

    while (pendingWrites.length > 0) {
      if (attempt >= DynamoDao.maxBatchAttempts) {
        throw new Error(
          `DynamoDB did not process all batch writes for '${this.tableName}'`,
        );
      }

      const output: BatchWriteCommandOutput = await this.client.send(
        new BatchWriteCommand({
          RequestItems: {
            [this.tableName]: pendingWrites,
          },
        }),
      );

      pendingWrites = output.UnprocessedItems?.[this.tableName] ?? [];
      if (pendingWrites.length > 0) {
        await this.waitBeforeBatchRetry(attempt);
      }
      attempt += 1;
    }
  }

  private async waitBeforeBatchRetry(attempt: number): Promise<void> {
    const delayMilliseconds = 25 * 2 ** attempt;
    await new Promise((resolve) => setTimeout(resolve, delayMilliseconds));
  }

  protected readRecord(
    value: unknown,
    attributeName: string,
  ): Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error(`Missing object attribute '${attributeName}'`);
    }

    return value as Record<string, unknown>;
  }

  protected readString(
    readItem: Record<string, unknown>,
    attributeName: string,
  ): string {
    const value = readItem[attributeName];
    if (typeof value !== "string") {
      throw new Error(`Missing string attribute '${attributeName}'`);
    }

    return value;
  }

  protected readNumber(
    readItem: Record<string, unknown>,
    attributeName: string,
  ): number {
    const value = readItem[attributeName];
    if (typeof value !== "number") {
      throw new Error(`Missing number attribute '${attributeName}'`);
    }

    return value;
  }
}
