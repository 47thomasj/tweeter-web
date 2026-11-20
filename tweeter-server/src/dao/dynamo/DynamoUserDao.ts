// Partially written by AI.
import type { UserDto } from "tweeter-shared";
import type { UserDao, UserWithoutImage } from "../UserDao";
import { S3Dao } from "../s3/S3Dao";
import { DynamoDao } from "./DynamoDao";

export class DynamoUserDao
  extends DynamoDao<UserDto, [alias: string]>
  implements UserDao
{
  private readonly aliasAttr = "alias";
  private readonly firstNameAttr = "first_name";
  private readonly lastNameAttr = "last_name";
  private readonly imageUrlAttr = "image_url";
  private readonly s3Dao = new S3Dao();

  public async createUser(
    user: UserWithoutImage,
    imageBytes: Uint8Array,
    imageFileExtension: string,
  ): Promise<UserDto> {
    const imageUrl = await this.s3Dao.putImage(
      `${user.alias}.${imageFileExtension}`,
      imageBytes,
    );
    const userWithImage: UserDto = { ...user, imageUrl };
    await super.putItem(userWithImage);
    return userWithImage;
  }

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
    const users = await this.batchGetItems(
      aliases.map((alias) => [alias] as [alias: string]),
    );
    return new Map(users.map((user) => [user.alias, user]));
  }
}
