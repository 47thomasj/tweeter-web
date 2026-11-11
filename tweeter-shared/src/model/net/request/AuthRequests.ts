import { TweeterRequest } from "../request/TweeterRequest";

export interface LoginRequest extends TweeterRequest {
    alias: string;
    password: string;
}

export interface RegisterRequest extends LoginRequest {
    firstName: string;
    lastName: string;
    userImageBytes: string;
    imageFileExtension: string;
}

export interface LogoutRequest extends TweeterRequest {
    token: string;
}