import { handle } from "../BasicLambda";
import { UserService } from "../../services/UserService";
import type { GetFollowCountRequest, GetFolloweeCountResponse } from "tweeter-shared";

export function handler(request: GetFollowCountRequest): Promise<GetFolloweeCountResponse> {
    return handle(UserService, async (userService) => {
        const followeeCount = await userService.getFolloweeCount(request.token, request.user);
        return { followeeCount };
    });
}