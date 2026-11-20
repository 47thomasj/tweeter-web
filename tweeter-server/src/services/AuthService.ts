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
import { ClientError } from "./ClientError";

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
      throw new ClientError("Invalid alias");
    }
    if (!(await bcrypt.compare(password, passwordHash))) {
      throw new ClientError("Invalid password");
    }

    const authToken = await this.createSession(user.alias);
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
      throw new ClientError("Alias is already registered");
    }

    const passwordHash = await this.hashPassword(password);
    await Promise.all([
      this.userDao.putItem(userDto),
      this.authDao.putItem({
        alias,
        passwordHash,
      }),
    ]);

    return [userDto, await this.createSession(alias)];
  }

  public async logout(token: string): Promise<void> {
    requireNonEmptyStrings(token);

    await this.sessionDao.deleteItem(token);
  }

  private hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private async createSession(userAlias: string): Promise<AuthTokenDto> {
    const authToken = AuthToken.Generate().dto;
    await this.sessionDao.putItem({
      token: authToken.token,
      timestamp: authToken.timestamp,
      userAlias,
      expiresAt: authToken.timestamp + this.sessionLifetimeMilliseconds,
    });
    return authToken;
  }
}
