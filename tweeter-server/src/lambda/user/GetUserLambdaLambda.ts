import { handle } from "../BasicLambda";
import { UserService } from "../../services/UserService";
import type { GetUserRequest, GetUserResponse } from "tweeter-shared";

export function handler(request: GetUserRequest): Promise<GetUserResponse> {
    return handle(UserService, async (userService) => {
        const user = await userService.getUser(request.token, request.alias);
        return { user };
    });
}