// Partially written by AI.

import type {
  PagedStatusItemRequest,
  PagedStatusItemResponse,
} from "tweeter-shared";
import { StatusService } from "../../services/StatusService";
import { handle } from "../BasicLambda";
import { validatePagedStatusItemRequest } from "../RequestValidation";

/**
 * Handles requests sent to the API Gateway route `POST /feed-items`.
 */
export function handler(
  request: PagedStatusItemRequest,
): Promise<PagedStatusItemResponse> {
  return handle(request, validatePagedStatusItemRequest, StatusService, async (
    statusService,
    validatedRequest,
  ) => {
    const [items, hasMore] = await statusService.loadMoreFeedItems(
      validatedRequest.token,
      validatedRequest.userAlias,
      validatedRequest.pageSize,
      validatedRequest.lastItem,
    );

    return { items, hasMore };
  });
}
