// Partially written by AI.

import type { PagedUserItemRequest, PagedUserItemResponse } from "tweeter-shared";
import { StatusService } from "../../services/StatusService";

/**
 * Handles requests sent to the API Gateway route `POST /story-items`.
 */
export async function handler(request: PagedUserItemRequest): Promise<PagedUserItemResponse> {
    const statusService = new StatusService();
    const [items, hasMore] = await statusService.loadMoreStoryItems(request.token, request.userAlias, request.pageSize, request.lastItem);
    return {
        success: true,
        message: null,
        items: items,
        hasMore: hasMore,
    }
}