import { LogoutRequest, TweeterResponse } from "tweeter-shared";
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