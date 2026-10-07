import { AuthService } from "../../model.service/AuthService";
import { AuthToken, User } from "tweeter-shared";

export interface AuthView {
    updateUserInfo: (user: User, authToken: AuthToken) => void;
    navigate: (url: string) => void;
    displayErrorMessage: (message: string) => void;
}

export abstract class AuthPresenter {
    private _view: AuthView;
    private _originalUrl: string | undefined;
    protected authService: AuthService;

    private _isLoading: boolean = false;
    
    protected constructor(view: AuthView, originalUrl: string | undefined) {
        this._view = view;
        this.authService = new AuthService();
        this.originalUrl = originalUrl;
    }

    protected get view(): AuthView {
        return this._view;
    }

    public get originalUrl(): string | undefined {
        return this._originalUrl;
    }

    protected set originalUrl(value: string | undefined) {
        this._originalUrl = value;
    }

    public get isLoading(): boolean {
        return this._isLoading;
    }

    protected set isLoading(value: boolean) {
        this._isLoading = value;
    }

    public abstract login(alias: string, password: string): Promise<void>;
}