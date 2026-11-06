// Partially written by AI.

import { LogoutRequest, TweeterResponse } from "tweeter-shared";
import { AuthService } from "../../services/AuthService";
import { handle } from "../BasicLambda";

// POST /logout
export function handler(request: LogoutRequest): Promise<TweeterResponse> {
  return handle(AuthService, async (authService) => {
    await authService.logout(request.token);
    return {};
  });
}
