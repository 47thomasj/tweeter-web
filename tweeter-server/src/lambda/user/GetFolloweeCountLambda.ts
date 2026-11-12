// Partially written by AI.

import { handle } from "../BasicLambda";
import { UserService } from "../../services/UserService";
import type {
  GetFollowCountRequest,
  GetFolloweeCountResponse,
} from "tweeter-shared";
import { validateGetFollowCountRequest } from "../RequestValidation";

// POST /followee-count
export function handler(
  request: GetFollowCountRequest,
): Promise<GetFolloweeCountResponse> {
  return handle(
    request,
    validateGetFollowCountRequest,
    UserService,
    async (userService, validatedRequest) => {
      const followeeCount = await userService.getFolloweeCount(
        validatedRequest.token,
        validatedRequest.user,
      );
      return { followeeCount };
    },
  );
}