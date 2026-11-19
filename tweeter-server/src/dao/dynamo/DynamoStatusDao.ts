// Partially written by AI.
import type { PutCommandInput } from "@aws-sdk/lib-dynamodb";
import {
  Type,
  type PostSegmentDto,
  type StatusDto,
  type UserDto,
} from "tweeter-shared";
import type { DataPage } from "../DataPage";
import type { StatusDao, StatusKey } from "../StatusDao";
import { DynamoDao } from "./DynamoDao";

export class DynamoStatusDao
  extends DynamoDao<
    StatusDto,
    [userAlias: string, timestamp: number]
  >
  implements StatusDao
{
  private readonly userAliasAttr = "user_alias";
  private readonly timestampAttr = "timestamp";
  private readonly postAttr = "post";
  private readonly userAttr = "user";
  private readonly segmentsAttr = "segments";

  protected mapItem(
    status: StatusDto,
  ): NonNullable<PutCommandInput["Item"]> {
    return {
      [this.userAliasAttr]: status.user.alias,
      [this.timestampAttr]: status.timestamp,
      [this.postAttr]: status.post,
      [this.userAttr]: { ...status.user },
      [this.segmentsAttr]: status.segments.map((segment) => ({
        ...segment,
      })),
    };
  }

  protected produceKey(userAlias: string, timestamp: number) {
    return {
      [this.userAliasAttr]: userAlias,
      [this.timestampAttr]: timestamp,
    };
  }

  protected produceFeedItemFromReadItem(
    readItem: Record<string, unknown>,
  ): StatusDto {
    return {
      post: this.readString(readItem, this.postAttr),
      user: this.readUser(readItem),
      timestamp: this.readNumber(readItem, this.timestampAttr),
      segments: this.readSegments(readItem),
    };
  }

  public async getBatchStatuses(
    keys: readonly StatusKey[],
  ): Promise<ReadonlyArray<StatusDto | undefined>> {
    const statuses = await this.batchGetItems(
      keys.map(
        (key) =>
          [key.userAlias, key.timestamp] as [
            userAlias: string,
            timestamp: number,
          ],
      ),
    );
    const statusesByKey = new Map(
      statuses.map((status) => [
        this.makeStatusKey(status.user.alias, status.timestamp),
        status,
      ]),
    );

    return keys.map((key) =>
      statusesByKey.get(
        this.makeStatusKey(key.userAlias, key.timestamp),
      ),
    );
  }

  public async getPageOfStoryItems(
    userAlias: string,
    pageSize: number,
    lastTimestamp?: number,
  ): Promise<DataPage<StatusDto>> {
    return this.queryPage({
      KeyConditionExpression: `${this.userAliasAttr} = :userAlias`,
      ExpressionAttributeValues: {
        ":userAlias": userAlias,
      },
      Limit: pageSize,
      ScanIndexForward: false,
      ...(lastTimestamp === undefined
        ? {}
        : {
            ExclusiveStartKey: {
              [this.userAliasAttr]: userAlias,
              [this.timestampAttr]: lastTimestamp,
            },
          }),
    });
  }

  private makeStatusKey(
    userAlias: string,
    timestamp: number,
  ): string {
    return JSON.stringify([userAlias, timestamp]);
  }

  private readUser(readItem: Record<string, unknown>): UserDto {
    const user = this.readRecord(
      readItem[this.userAttr],
      this.userAttr,
    );

    return {
      firstName: this.readString(user, "firstName"),
      lastName: this.readString(user, "lastName"),
      alias: this.readString(user, "alias"),
      imageUrl: this.readString(user, "imageUrl"),
    };
  }

  private readSegments(
    readItem: Record<string, unknown>,
  ): PostSegmentDto[] {
    const value = readItem[this.segmentsAttr];
    if (!Array.isArray(value)) {
      throw new Error(
        `Missing array attribute '${this.segmentsAttr}'`,
      );
    }

    return value.map((segment, index) => {
      const segmentItem = this.readRecord(
        segment,
        `${this.segmentsAttr}[${index}]`,
      );
      const type = this.readString(segmentItem, "type");
      if (!Object.values(Type).includes(type as Type)) {
        throw new Error(`Invalid status segment type '${type}'`);
      }

      return {
        text: this.readString(segmentItem, "text"),
        startPosition: this.readNumber(
          segmentItem,
          "startPosition",
        ),
        endPosition: this.readNumber(
          segmentItem,
          "endPosition",
        ),
        type: type as Type,
      };
    });
  }

}
