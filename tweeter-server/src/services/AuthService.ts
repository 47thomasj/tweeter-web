// Partially written by AI.

import { Buffer } from "buffer";
import { FakeData } from "tweeter-shared";
import { Service } from "./Service";
import { UserDto } from "tweeter-shared/src/model/dto/UserDto";
import { AuthTokenDto } from "tweeter-shared/src/model/dto/AuthTokenDto";
import {
  requireNonEmptyBytes,
  requireNonEmptyStrings,
} from "./RequestValidation";
import type { DaoFactory } from "../dao/DaoFactory";
import type { UserDao } from "../dao/UserDao";
import bcrypt from "bcryptjs";

export class AuthService implements Service {
  private readonly userDao: UserDao;

  public constructor(daoFactory: DaoFactory) {
    this.userDao = daoFactory.getUserDao();
  }

  public async login(
    alias: string,
    password: string,
  ): Promise<[UserDto, AuthTokenDto]> {
    requireNonEmptyStrings(alias, password);

    const hashedPassword = this.hashPassword(password);
    // TODO: Create an authToken for the User.

    if (user === null) {
      throw new Error("Invalid alias or password");
    }

    return [user.dto, FakeData.instance.authToken.dto];
  }

  public async register(
    firstName: string,
    lastName: string,
    alias: string,
    password: string,
    userImageBytes: Uint8Array,
    imageFileExtension: string,
  ): Promise<[UserDto, AuthTokenDto]> {
    requireNonEmptyStrings(
      firstName,
      lastName,
      alias,
      password,
      imageFileExtension,
    );
    requireNonEmptyBytes(userImageBytes);

    const imageStringBase64: string =
      Buffer.from(userImageBytes).toString("base64");

    const imageUrl = imageStringBase64; // TODO: Replace once images are stored in S3.

    const userDto: UserDto = {
      alias,
      firstName,
      lastName,
      imageUrl,
    };

    await this.userDao.putItem(userDto);
    // TODO: Add the user alias/password to the auth table with a token.
    const [user, token] = await this.login(alias, password);

    if (user === null) {
      throw new Error("Invalid registration");
    }

    return [user, token];
  }

  public async logout(token: string): Promise<void> {
    requireNonEmptyStrings(token);

    // TODO: Delete the token from the auth table.
  }

  private hashPassword(password: string): string {
    return bcrypt.hashSync(password, this.createSaltFromPassword(password));
  }

  private createSaltFromPassword(password: string): string {
    return bcrypt.genSaltSync(10);
  }
}
