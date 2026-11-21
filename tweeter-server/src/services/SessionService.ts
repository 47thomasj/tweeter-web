// Partially written by AI.

import { Service } from "./Service";
import type { SessionDao } from "../dao/SessionDao";
import type { DaoFactory } from "../dao/DaoFactory";
import { requireNonEmptyStrings } from "./RequestValidation";
import { ClientError } from "./ClientError";

export class SessionService implements Service {
  private readonly sessionDao: SessionDao;

  public constructor(daoFactory: DaoFactory) {
    this.sessionDao = daoFactory.getSessionDao();
  }

  public async validateSession(token: string): Promise<string> {
    requireNonEmptyStrings(token);

    const session = await this.sessionDao.getItem(token);
    if (session === undefined) {
      throw new ClientError("Action Not Allowed");
    }

    if (session.expiresAt <= Math.floor(Date.now() / 1000)) {
      await this.sessionDao.deleteItem(token);
      throw new ClientError("Session expired");
    }

    return session.userAlias;
  }
}
