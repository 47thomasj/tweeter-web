// Partially written by AI.

import {
  PagedStatusItemRequest,
  PagedUserItemRequest,
  Status,
  StatusDto,
  TweeterRequest,
  TweeterResponse,
  User,
  UserDto,
} from "tweeter-shared";
import { ClientCommunicator } from "./ClientCommunicator";

interface PagedItemResponse<Dto> extends TweeterResponse {
  readonly items: Dto[] | null;
  readonly hasMore: boolean;
}

export class ServerFacade {
  private readonly SERVER_URL =
    "https://3hayumc9i0.execute-api.us-east-2.amazonaws.com/dev";

  private clientCommunicator = new ClientCommunicator(this.SERVER_URL);

  private async makeServerRequest<
    Request extends TweeterRequest,
    Dto,
    Item,
  >(
    request: Request,
    requestPath: string,
    deserialize: (dto: Dto) => Item,
    itemDescriptor: string,
  ): Promise<[Item[], boolean]> {
    const response = await this.clientCommunicator.doPost<
      Request,
      PagedItemResponse<Dto>
    >(request, requestPath);

    const items: Item[] | null =
      response.success && response.items
        ? response.items.map(deserialize)
        : null;

    if (response.success) {
      if (items == null) {
        throw new Error(`No ${itemDescriptor} found`);
      } else {
        return [items, response.hasMore];
      }
    } else {
      console.error(response);
      throw new Error(response.message ?? undefined);
    }
  }

  public async getMoreFollowees(
    request: PagedUserItemRequest,
  ): Promise<[User[], boolean]> {
    return this.makeServerRequest(
      request,
      "/followees",
      (dto: UserDto) => User.fromDto(dto) as User,
      "followees",
    );
  }

  public async loadMoreFeedItems(
    request: PagedStatusItemRequest,
  ): Promise<[Status[], boolean]> {
    return this.makeServerRequest(
      request,
      "/feed-items",
      (dto: StatusDto) => Status.fromDto(dto) as Status,
      "feed items",
    );
  }
}
