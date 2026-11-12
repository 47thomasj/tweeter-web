// Partially written by AI.

import type {
  PagedStatusItemRequest,
  PagedStatusItemResponse,
} from "tweeter-shared";
import { StatusService } from "../../services/StatusService";
import { handle } from "../BasicLambda";

/**
 * Handles requests sent to the API Gateway route `POST /feed-items`.
 */
export function handler(
  request: PagedStatusItemRequest,
): Promise<PagedStatusItemResponse> {
  return handle(StatusService, async (statusService) => {
    const [items, hasMore] = await statusService.loadMoreFeedItems(
      request.token,
      request.userAlias,
      request.pageSize,
      request.lastItem,
    );

    return { items, hasMore };
  });
}
