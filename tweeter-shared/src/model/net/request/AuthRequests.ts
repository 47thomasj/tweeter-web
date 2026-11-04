export interface LoginRequest {
    alias: string;
    password: string;
}

export interface RegisterRequest extends LoginRequest {
    firstName: string;
    lastName: string;
    userImageBytes: string;
    imageFileExtension: string;
}

export interface LogoutRequest {
    token: string;
}