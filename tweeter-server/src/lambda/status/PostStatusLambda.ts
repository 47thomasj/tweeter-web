import type {
    PostStatusRequest,
    TweeterResponse,
  } from "tweeter-shared";
  import { StatusService } from "../../services/StatusService";
  
  /**
   * Handles requests sent to the API Gateway route `POST /post-status`.
   */
  export async function handler(
    request: PostStatusRequest,
  ): Promise<TweeterResponse> {
    const statusService = new StatusService();
    await statusService.postStatus(
      request.token,
      request.status,
    );
    return {
      success: true,
      message: null,
    };
  }
  