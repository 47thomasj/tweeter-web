import { handle } from "../BasicLambda";
import { UserService } from "../../services/UserService";
import type { FollowRequest, FollowActionResponse } from "tweeter-shared";

// POST /follow
export function handler(request: FollowRequest): Promise<FollowActionResponse> {
    return handle(UserService, async (userService) => {
        const [followerCount, followeeCount] = await userService.follow(request.token, request.userToFollow);
        return { followerCount, followeeCount };
    });
}