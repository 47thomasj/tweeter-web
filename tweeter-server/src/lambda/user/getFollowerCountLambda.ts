import { handle } from "../BasicLambda";
import { UserService } from "../../services/UserService";
import type { GetFollowCountRequest, GetFollowerCountResponse } from "tweeter-shared";

// POST /follower-count
export function handler(request: GetFollowCountRequest): Promise<GetFollowerCountResponse> {
    return handle(UserService, async (userService) => {
        const followerCount = await userService.getFollowerCount(request.token, request.user);
        return { followerCount };
    });
}