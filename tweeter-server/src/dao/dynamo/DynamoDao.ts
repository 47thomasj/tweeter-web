// Partially written by AI.
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
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

export abstract class DynamoDao<T, KeyArgs extends unknown[]>
  implements Dao<T, KeyArgs>
{
  protected readonly tableName: string;
  protected readonly client = DynamoDBDocumentClient.from(
    new DynamoDBClient(),
  );

  public constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Converts a known item into an "Item" map that can be used to put items to the table.
   * @param item.
   */
  protected abstract mapItem(
    item: T,
  ): NonNullable<PutCommandInput["Item"]>;

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

  protected readRecord(
    value: unknown,
    attributeName: string,
  ): Record<string, unknown> {
    if (
      typeof value !== "object" ||
      value === null ||
      Array.isArray(value)
    ) {
      throw new Error(
        `Missing object attribute '${attributeName}'`,
      );
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
