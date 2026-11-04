import { UserDto } from "../../dto/UserDto";
import { AuthTokenDto } from "../../dto/AuthTokenDto";
import { TweeterResponse } from "./TweeterResponse";

export interface AuthResponse extends TweeterResponse {
    user: UserDto | null;
    authToken: AuthTokenDto | null;
}