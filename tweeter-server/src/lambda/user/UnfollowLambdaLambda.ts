// Partially written by AI.

import { handle } from "../BasicLambda";
import { UserService } from "../../services/UserService";
import type { UnfollowRequest, FollowActionResponse } from "tweeter-shared";
import { validateUnfollowRequest } from "../RequestValidation";

// POST /unfollow
export function handler(request: UnfollowRequest): Promise<FollowActionResponse> {
  return handle(
    request,
    validateUnfollowRequest,
    UserService,
    async (userService, validatedRequest) => {
      const [followerCount, followeeCount] = await userService.unfollow(
        validatedRequest.token,
        validatedRequest.userToUnfollow,
      );
      return { followerCount, followeeCount };
    },
  );
}