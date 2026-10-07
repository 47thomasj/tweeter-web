import { AuthToken, FakeData } from "tweeter-shared";

export class AuthService {
  public async login(alias: string, password: string): Promise<AuthToken> {
    return FakeData.instance.authToken;
  }
}
