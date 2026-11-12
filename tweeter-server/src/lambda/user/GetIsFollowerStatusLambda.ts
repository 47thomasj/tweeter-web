// Partially written by AI.

import { handle } from "../BasicLambda";
import { UserService } from "../../services/UserService";
import type {
  GetIsFollowerStatusRequest,
  GetIsFollowerStatusResponse,
} from "tweeter-shared";
import { validateGetIsFollowerStatusRequest } from "../RequestValidation";

// POST /is-follower-status
export function handler(
  request: GetIsFollowerStatusRequest,
): Promise<GetIsFollowerStatusResponse> {
  return handle(
    request,
    validateGetIsFollowerStatusRequest,
    UserService,
    async (userService, validatedRequest) => {
      const isFollower = await userService.getIsFollowerStatus(
        validatedRequest.token,
        validatedRequest.user,
        validatedRequest.selectedUser,
      );
      return { isFollower };
    },
  );
}