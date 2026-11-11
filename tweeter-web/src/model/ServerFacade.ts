// Partially written by AI.

import {
  AuthResponse,
  AuthToken,
  FollowActionResponse,
  FollowRequest,
  GetFollowCountRequest,
  GetFolloweeCountResponse,
  GetFollowerCountResponse,
  GetIsFollowerStatusRequest,
  GetIsFollowerStatusResponse,
  GetUserRequest,
  GetUserResponse,
  LoginRequest,
  LogoutRequest,
  PagedStatusItemRequest,
  PagedUserItemRequest,
  PostStatusRequest,
  RegisterRequest,
  Status,
  StatusDto,
  TweeterRequest,
  TweeterResponse,
  UnfollowRequest,
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
    Response extends TweeterResponse,
  >(request: Request, requestPath: string): Promise<Response> {
    const response = await this.clientCommunicator.doPost<Request, Response>(
      request,
      requestPath,
    );

    if (!response.success) {
      console.error(response);
      throw new Error(response.message ?? undefined);
    }

    return response;
  }

  private async makePaginatedServerRequest<
    Request extends TweeterRequest,
    Dto,
    Item,
  >(
    request: Request,
    requestPath: string,
    deserialize: (dto: Dto) => Item,
    itemDescriptor: string,
  ): Promise<[Item[], boolean]> {
    const response = await this.makeServerRequest<
      Request,
      PagedItemResponse<Dto>
    >(request, requestPath);

    if (response.items === null) {
      throw new Error(`No ${itemDescriptor} found`);
    }

    return [response.items.map(deserialize), response.hasMore];
  }

  private async makeAuthServerRequest<Request extends LoginRequest>(
    request: Request,
    requestPath: string,
    actionDescriptor: string,
  ): Promise<[User, AuthToken]> {
    const response = await this.makeServerRequest<Request, AuthResponse>(
      request,
      requestPath,
    );
    const user = User.fromDto(response.user);
    const authToken = AuthToken.fromDto(response.authToken);

    if (user === null || authToken === null) {
      throw new Error(`Invalid ${actionDescriptor}`);
    }

    return [user, authToken];
  }

  public async login(request: LoginRequest): Promise<[User, AuthToken]> {
    return this.makeAuthServerRequest(request, "/login", "login");
  }

  public async register(
    request: RegisterRequest,
  ): Promise<[User, AuthToken]> {
    return this.makeAuthServerRequest(request, "/register", "registration");
  }

  public async logout(request: LogoutRequest): Promise<void> {
    await this.makeServerRequest<LogoutRequest, TweeterResponse>(
      request,
      "/logout",
    );
  }

  public async getMoreFollowees(
    request: PagedUserItemRequest,
  ): Promise<[User[], boolean]> {
    return this.makePaginatedServerRequest(
      request,
      "/followees",
      (dto: UserDto) => User.fromDto(dto) as User,
      "followees",
    );
  }

  public async getMoreFollowers(
    request: PagedUserItemRequest,
  ): Promise<[User[], boolean]> {
    return this.makePaginatedServerRequest(
      request,
      "/followers",
      (dto: UserDto) => User.fromDto(dto) as User,
      "followers",
    );
  }

  public async loadMoreFeedItems(
    request: PagedStatusItemRequest,
  ): Promise<[Status[], boolean]> {
    return this.makePaginatedServerRequest(
      request,
      "/feed-items",
      (dto: StatusDto) => Status.fromDto(dto) as Status,
      "feed items",
    );
  }

  public async loadMoreStoryItems(
    request: PagedStatusItemRequest,
  ): Promise<[Status[], boolean]> {
    return this.makePaginatedServerRequest(
      request,
      "/story-items",
      (dto: StatusDto) => Status.fromDto(dto) as Status,
      "story items",
    );
  }

  public async postStatus(
    request: PostStatusRequest,
  ): Promise<void> {
    await this.makeServerRequest<PostStatusRequest, TweeterResponse>(
      request,
      "/post-status",
    );
  }

  public async getUser(request: GetUserRequest): Promise<User | null> {
    const response = await this.makeServerRequest<GetUserRequest, GetUserResponse>(
      request,
      "/user",
    );
    return User.fromDto(response.user);
  }

  public async getIsFollowerStatus(
    request: GetIsFollowerStatusRequest,
  ): Promise<boolean> {
    const response = await this.makeServerRequest<
      GetIsFollowerStatusRequest,
      GetIsFollowerStatusResponse
    >(request, "/is-follower-status");
    return response.isFollower;
  }

  public async getFolloweeCount(
    request: GetFollowCountRequest,
  ): Promise<number> {
    const response = await this.makeServerRequest<
      GetFollowCountRequest,
      GetFolloweeCountResponse
    >(request, "/followee-count");
    return response.followeeCount;
  }

  public async getFollowerCount(
    request: GetFollowCountRequest,
  ): Promise<number> {
    const response = await this.makeServerRequest<
      GetFollowCountRequest,
      GetFollowerCountResponse
    >(request, "/follower-count");
    return response.followerCount;
  }

  public async follow(
    request: FollowRequest,
  ): Promise<[followerCount: number, followeeCount: number]> {
    const response = await this.makeServerRequest<
      FollowRequest,
      FollowActionResponse
    >(request, "/follow");
    return [response.followerCount, response.followeeCount];
  }

  public async unfollow(
    request: UnfollowRequest,
  ): Promise<[followerCount: number, followeeCount: number]> {
    const response = await this.makeServerRequest<
      UnfollowRequest,
      FollowActionResponse
    >(request, "/unfollow");
    return [response.followerCount, response.followeeCount];
  }
}
