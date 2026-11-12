// Partially written by AI.

import type {
  PagedUserItemRequest,
  PagedUserItemResponse,
} from "tweeter-shared";
import { FollowService } from "../../services/FollowService";
import { handle } from "../BasicLambda";
import { validatePagedUserItemRequest } from "../RequestValidation";

/**
 * Handles requests sent to the API Gateway route `POST /followees`.
 */
export function handler(
  request: PagedUserItemRequest,
): Promise<PagedUserItemResponse> {
  return handle(request, validatePagedUserItemRequest, FollowService, async (
    followService,
    validatedRequest,
  ) => {
    const [items, hasMore] = await followService.loadMoreFollowees(
      validatedRequest.token,
      validatedRequest.userAlias,
      validatedRequest.pageSize,
      validatedRequest.lastItem,
    );

    return { items, hasMore };
  });
}
