// Partially written by AI.

import { LogoutRequest, TweeterResponse } from "tweeter-shared";
import { AuthService } from "../../services/AuthService";
import { handle } from "../BasicLambda";
import { validateLogoutRequest } from "../RequestValidation";

// POST /logout
export function handler(request: LogoutRequest): Promise<TweeterResponse> {
  return handle(
    request,
    validateLogoutRequest,
    AuthService,
    async (authService, validatedRequest) => {
      await authService.logout(validatedRequest.token);
      return {};
    },
  );
}
