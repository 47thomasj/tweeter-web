// Partially written by AI.

import type { LoginRequest } from "tweeter-shared";
import type { AuthResponse } from "tweeter-shared/src/model/net/responses/AuthReponse";
import { AuthService } from "../../services/AuthService";
import { handle } from "../BasicLambda";

// POST /login
export function handler(request: LoginRequest): Promise<AuthResponse> {
  return handle(AuthService, async (authService) => {
    const [user, authToken] = await authService.login(
      request.alias,
      request.password,
    );
    return { user, authToken };
  });
}
