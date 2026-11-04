import type { LoginRequest } from "tweeter-shared";
import type { AuthResponse } from "tweeter-shared/src/model/net/responses/AuthReponse";
import { AuthService } from "../../services/AuthService";

// POST /login
export async function handler(request: LoginRequest): Promise<AuthResponse> {
    const authService = new AuthService();
    const [user, authToken] = await authService.login(request.alias, request.password);
    return {
        success: true,
        message: null,
        user: user,
        authToken: authToken,
    }
}