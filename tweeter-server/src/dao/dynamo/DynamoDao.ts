// Partially written by AI.
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  type GetCommandInput,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { Dao } from "../Dao";

export abstract class DynamoDao<T, KeyArgs extends unknown[]> implements Dao<T, KeyArgs> {
  private readonly tableName: string;
  private readonly client = DynamoDBDocumentClient.from(new DynamoDBClient());

  public constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Converts a known item into an "Item" map that can be used to put items to the table.
   * @param item.
   */
  protected abstract mapItem(item: T): Record<string, string>;

  /**
   * Returns the key of the item to be used to get the item from the table.
   * @param args.
   */
  protected abstract produceKey(...args: KeyArgs): GetCommandInput["Key"];

  /**
   * Converts a raw read item into a known item.
   * @param readItem.
   */
  protected abstract produceItemFromReadItem(readItem: Record<string, any>): T;


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
}
