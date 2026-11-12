// Partially written by AI.

import type { LoginRequest } from "tweeter-shared";
import type { AuthResponse } from "tweeter-shared/src/model/net/responses/AuthReponse";
import { AuthService } from "../../services/AuthService";
import { handle } from "../BasicLambda";
import { validateLoginRequest } from "../RequestValidation";

// POST /login
export function handler(request: LoginRequest): Promise<AuthResponse> {
  return handle(request, validateLoginRequest, AuthService, async (
    authService,
    validatedRequest,
  ) => {
    const [user, authToken] = await authService.login(
      validatedRequest.alias,
      validatedRequest.password,
    );
    return { user, authToken };
  });
}
