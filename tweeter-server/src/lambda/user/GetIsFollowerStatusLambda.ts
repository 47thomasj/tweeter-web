import { handle } from "../BasicLambda";
import { UserService } from "../../services/UserService";
import type { GetIsFollowerStatusRequest, GetIsFollowerStatusResponse } from "tweeter-shared";

export function handler(request: GetIsFollowerStatusRequest): Promise<GetIsFollowerStatusResponse> {
    return handle(UserService, async (userService) => {
        const isFollower = await userService.getIsFollowerStatus(request.token, request.user, request.selectedUser);
        return { isFollower };
    });
}