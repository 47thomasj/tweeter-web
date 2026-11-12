import { handle } from "../BasicLambda";
import { UserService } from "../../services/UserService";
import type { UnfollowRequest, FollowActionResponse } from "tweeter-shared";

// POST /unfollow
export function handler(request: UnfollowRequest): Promise<FollowActionResponse> {
    return handle(UserService, async (userService) => {
        const [followerCount, followeeCount] = await userService.unfollow(request.token, request.userToUnfollow);
        return { followerCount, followeeCount };
    });
}