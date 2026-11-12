// Partially written by AI.

import { handle } from "../BasicLambda";
import { UserService } from "../../services/UserService";
import type { FollowRequest, FollowActionResponse } from "tweeter-shared";
import { validateFollowRequest } from "../RequestValidation";

// POST /follow
export function handler(request: FollowRequest): Promise<FollowActionResponse> {
  return handle(
    request,
    validateFollowRequest,
    UserService,
    async (userService, validatedRequest) => {
      const [followerCount, followeeCount] = await userService.follow(
        validatedRequest.token,
        validatedRequest.userToFollow,
      );
      return { followerCount, followeeCount };
    },
  );
}