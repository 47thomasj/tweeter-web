import { LogoutRequest } from "tweeter-shared";
import { TweeterResponse } from "tweeter-shared/dist/model/net/responses/TweeterResponse";
import { AuthService } from "../../services/AuthService";

// POST /logout
export async function handler(request: LogoutRequest): Promise<TweeterResponse> {
    const authService = new AuthService();
    await authService.logout(request.token);
    return {
        success: true,
        message: null,
    }
}