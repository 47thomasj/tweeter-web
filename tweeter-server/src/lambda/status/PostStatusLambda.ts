// Partially written by AI.

import type { PostStatusRequest, TweeterResponse } from "tweeter-shared";
import { StatusService } from "../../services/StatusService";
import { handle } from "../BasicLambda";

/**
 * Handles requests sent to the API Gateway route `POST /post-status`.
 */
export function handler(request: PostStatusRequest): Promise<TweeterResponse> {
  return handle(StatusService, async (statusService) => {
    await statusService.postStatus(request.token, request.status);
    return {};
  });
}
