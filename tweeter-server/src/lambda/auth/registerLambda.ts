// Partially written by AI.
import { Buffer } from "buffer";
import { RegisterRequest } from "tweeter-shared";
import { AuthResponse } from "tweeter-shared";
import { AuthService } from "../../services/AuthService";

// POST /register
export async function handler(request: RegisterRequest): Promise<AuthResponse> {
  const authService = new AuthService();

  const imageBytes = Buffer.from(request.userImageBytes, "base64");
  const [user, authToken] = await authService.register(
    request.firstName,
    request.lastName,
    request.alias,
    request.password,
    imageBytes,
    request.imageFileExtension,
  );
  return {
    success: true,
    message: null,
    user: user,
    authToken: authToken,
  };
}
