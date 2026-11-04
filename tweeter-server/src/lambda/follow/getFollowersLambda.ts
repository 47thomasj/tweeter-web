import type { PagedUserItemRequest, PagedUserItemResponse } from "tweeter-shared";
import { FollowService } from "../../services/FollowService";

/**
 * Handles requests sent to the API Gateway route `POST /followers`.
 */
export async function handler(request: PagedUserItemRequest): Promise<PagedUserItemResponse> {
    const followService = new FollowService();
    const [items, hasMore] = await followService.loadMoreFollowers(request.token, request.userAlias, request.pageSize, request.lastItem);
    return {
        success: true,
        message: null,
        items: items,
        hasMore: hasMore,
    }
}