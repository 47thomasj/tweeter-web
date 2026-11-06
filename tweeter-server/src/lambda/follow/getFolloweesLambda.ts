// Partially written by AI.

import type {
  PagedUserItemRequest,
  PagedUserItemResponse,
} from "tweeter-shared";
import { FollowService } from "../../services/FollowService";
import { handle } from "../BasicLambda";

/**
 * Handles requests sent to the API Gateway route `POST /followees`.
 */
export function handler(
  request: PagedUserItemRequest,
): Promise<PagedUserItemResponse> {
  return handle(FollowService, async (followService) => {
    const [items, hasMore] = await followService.loadMoreFollowees(
      request.token,
      request.userAlias,
      request.pageSize,
      request.lastItem,
    );

    return { items, hasMore };
  });
}
