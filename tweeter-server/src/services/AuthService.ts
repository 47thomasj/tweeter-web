// Partially written by AI.

import { Buffer } from "buffer";
import { AuthToken, type AuthTokenDto, type UserDto } from "tweeter-shared";
import { Service } from "./Service";
import {
  requireNonEmptyBytes,
  requireNonEmptyStrings,
} from "./RequestValidation";
import type { AuthDao } from "../dao/AuthDao";
import type { DaoFactory } from "../dao/DaoFactory";
import type { SessionDao } from "../dao/SessionDao";
import type { UserDao } from "../dao/UserDao";
import bcrypt from "bcryptjs";

export class AuthService implements Service {
  private readonly authDao: AuthDao;
  private readonly sessionDao: SessionDao;
  private readonly userDao: UserDao;

  private readonly sessionLifetimeMilliseconds = 30 * 60 * 1000;

  public constructor(daoFactory: DaoFactory) {
    this.authDao = daoFactory.getAuthDao();
    this.sessionDao = daoFactory.getSessionDao();
    this.userDao = daoFactory.getUserDao();
  }

  public async validateSession(token: string): Promise<string | null> {
    requireNonEmptyStrings(token);

    const session = await this.sessionDao.getItem(token);
    if (session === undefined) {
      throw new Error("Action Not Allowed");
    }
    return session.userAlias;
  }

  public async login(
    alias: string,
    password: string,
  ): Promise<[UserDto, AuthTokenDto]> {
    requireNonEmptyStrings(alias, password);

    const [passwordHash, user] = await Promise.all([
      this.authDao.getPasswordHash(alias),
      this.userDao.getItem(alias),
    ]);
    if (passwordHash === undefined || user === undefined) {
      throw new Error("Invalid alias");
    }
    if (!(await bcrypt.compare(password, passwordHash))) {
      throw new Error("Invalid password");
    }

    const authToken = this.createAuthToken();
    await this.sessionDao.putItem({
      token: authToken.token,
      timestamp: authToken.timestamp,
      userAlias: user.alias,
      expiresAt: authToken.timestamp + this.sessionLifetimeMilliseconds,
    });
    return [user, authToken];
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

    const [existingPasswordHash, existingUser] = await Promise.all([
      this.authDao.getPasswordHash(alias),
      this.userDao.getItem(alias),
    ]);
    if (existingPasswordHash !== undefined || existingUser !== undefined) {
      throw new Error("Alias is already registered");
    }

    await Promise.all([
      this.userDao.putItem(userDto),
      this.authDao.putItem({
        alias,
        passwordHash: this.hashPassword(password),
      }),
    ]);

    return await this.login(alias, password);
  }

  public async logout(token: string): Promise<void> {
    requireNonEmptyStrings(token);

    await this.sessionDao.deleteItem(token);
  }

  private hashPassword(password: string): string {
    return bcrypt.hashSync(password);
  }

  private createAuthToken(): AuthTokenDto {
    return AuthToken.Generate().dto;
  }
}
