// Partially written by AI.

import { Service } from "./Service";
import { SESSION_LIFETIME_SECONDS, type SessionDao } from "../dao/SessionDao";
import type { DaoFactory } from "../dao/DaoFactory";
import { requireNonEmptyStrings } from "./RequestValidation";
import { ClientError } from "./ClientError";

export class SessionService implements Service {
  private readonly sessionDao: SessionDao;
  private readonly sessionLifetimeSeconds = SESSION_LIFETIME_SECONDS;

  public constructor(daoFactory: DaoFactory) {
    this.sessionDao = daoFactory.getSessionDao();
  }

  public async validateSession(token: string): Promise<string> {
    requireNonEmptyStrings(token);

    const session = await this.sessionDao.getItem(token);
    if (session === undefined) {
      throw new ClientError("Action Not Allowed");
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (session.expiresAt <= nowSeconds) {
      await this.sessionDao.deleteItem(token);
      throw new ClientError("Session expired");
    }

    session.expiresAt = nowSeconds + this.sessionLifetimeSeconds;
    await this.sessionDao.putItem(session);

    return session.userAlias;
  }
}
