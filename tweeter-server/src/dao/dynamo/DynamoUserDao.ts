// Partially written by AI.
import type { UserDto } from "tweeter-shared";
import type { UserDao } from "../UserDao";
import { DynamoDao } from "./DynamoDao";

export class DynamoUserDao
  extends DynamoDao<UserDto, [alias: string]>
  implements UserDao
{
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

  protected produceFeedItemFromReadItem(
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
    const users = await this.batchGetItems(
      aliases.map((alias) => [alias] as [alias: string]),
    );
    return new Map(
      users.map((user) => [user.alias, user]),
    );
  }
}
