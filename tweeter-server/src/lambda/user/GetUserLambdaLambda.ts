// Partially written by AI.

import { handle } from "../BasicLambda";
import { UserService } from "../../services/UserService";
import type { GetUserRequest, GetUserResponse } from "tweeter-shared";
import { validateGetUserRequest } from "../RequestValidation";

// POST /user
export function handler(request: GetUserRequest): Promise<GetUserResponse> {
  return handle(
    request,
    validateGetUserRequest,
    UserService,
    async (userService, validatedRequest) => {
      const user = await userService.getUser(
        validatedRequest.token,
        validatedRequest.alias,
      );
      return { user };
    },
  );
}