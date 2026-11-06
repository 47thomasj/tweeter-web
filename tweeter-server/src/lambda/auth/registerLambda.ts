// Partially written by AI.
import { Buffer } from "buffer";
import { RegisterRequest } from "tweeter-shared";
import { AuthResponse } from "tweeter-shared";
import { AuthService } from "../../services/AuthService";
import { handle } from "../BasicLambda";

// POST /register
export function handler(request: RegisterRequest): Promise<AuthResponse> {
  return handle(AuthService, async (authService) => {
    const imageBytes = Buffer.from(request.userImageBytes, "base64");
    const [user, authToken] = await authService.register(
      request.firstName,
      request.lastName,
      request.alias,
      request.password,
      imageBytes,
      request.imageFileExtension,
    );

    return { user, authToken };
  });
}
