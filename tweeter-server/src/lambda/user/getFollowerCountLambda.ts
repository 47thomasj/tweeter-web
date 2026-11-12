// Partially written by AI.

import { handle } from "../BasicLambda";
import { UserService } from "../../services/UserService";
import type {
  GetFollowCountRequest,
  GetFollowerCountResponse,
} from "tweeter-shared";
import { validateGetFollowCountRequest } from "../RequestValidation";

// POST /follower-count
export function handler(
  request: GetFollowCountRequest,
): Promise<GetFollowerCountResponse> {
  return handle(
    request,
    validateGetFollowCountRequest,
    UserService,
    async (userService, validatedRequest) => {
      const followerCount = await userService.getFollowerCount(
        validatedRequest.token,
        validatedRequest.user,
      );
      return { followerCount };
    },
  );
}