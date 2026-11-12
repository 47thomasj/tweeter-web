// Partially written by AI.
import { Buffer } from "buffer";
import { RegisterRequest } from "tweeter-shared";
import { AuthResponse } from "tweeter-shared";
import { AuthService } from "../../services/AuthService";
import { handle } from "../BasicLambda";
import { validateRegisterRequest } from "../RequestValidation";

// POST /register
export function handler(request: RegisterRequest): Promise<AuthResponse> {
  return handle(request, validateRegisterRequest, AuthService, async (
    authService,
    validatedRequest,
  ) => {
    const imageBytes = Buffer.from(
      validatedRequest.userImageBytes,
      "base64",
    );
    const [user, authToken] = await authService.register(
      validatedRequest.firstName,
      validatedRequest.lastName,
      validatedRequest.alias,
      validatedRequest.password,
      imageBytes,
      validatedRequest.imageFileExtension,
    );

    return { user, authToken };
  });
}
