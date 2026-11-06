import type {
    PagedStatusItemRequest,
    PagedStatusItemResponse,
  } from "tweeter-shared";
  import { StatusService } from "../../services/StatusService";
  
  /**
   * Handles requests sent to the API Gateway route `POST /feed-items`.
   */
  export async function handler(
    request: PagedStatusItemRequest,
  ): Promise<PagedStatusItemResponse> {
    const statusService = new StatusService();
    const [items, hasMore] = await statusService.loadMoreFeedItems(
      request.token,
      request.userAlias,
      request.pageSize,
      request.lastItem,
    );
    return {
      success: true,
      message: null,
      items: items,
      hasMore: hasMore,
    };
  }
  