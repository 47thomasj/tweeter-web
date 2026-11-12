// Partially written by AI.

import type { PostStatusRequest, TweeterResponse } from "tweeter-shared";
import { StatusService } from "../../services/StatusService";
import { handle } from "../BasicLambda";
import { validatePostStatusRequest } from "../RequestValidation";

/**
 * Handles requests sent to the API Gateway route `POST /post-status`.
 */
export function handler(request: PostStatusRequest): Promise<TweeterResponse> {
  return handle(
    request,
    validatePostStatusRequest,
    StatusService,
    async (statusService, validatedRequest) => {
      await statusService.postStatus(
        validatedRequest.token,
        validatedRequest.status,
      );
      return {};
    },
  );
}
