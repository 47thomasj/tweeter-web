import { AuthService } from "../../model.service/AuthService";
import { AuthToken, User } from "tweeter-shared";
import { Presenter, View } from "../Presenter";

export interface AuthView extends View {
  updateUserInfo: (user: User, authToken: AuthToken) => void;
  navigate: (url: string) => void;
  setImageUrl?: (url: string) => void;
  setImageBytes?: (bytes: Uint8Array) => void;
  setImageFileExtension?: (extension: string) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export abstract class AuthPresenter extends Presenter<AuthView> {
  private _originalUrl: string | undefined;
  protected authService: AuthService;

  protected constructor(view: AuthView, originalUrl: string | undefined) {
    super(view);
    this.authService = new AuthService();
    this.originalUrl = originalUrl;
  }

  public get originalUrl(): string | undefined {
    return this._originalUrl;
  }

  protected set originalUrl(value: string | undefined) {
    this._originalUrl = value;
  }

  public checkSubmitButtonStatus(
    firstName?: string,
    lastName?: string,
    alias?: string,
    password?: string,
    imageUrl?: string,
    imageFileExtension?: string,
  ): boolean {
    return (
      !firstName ||
      !lastName ||
      !alias ||
      !password ||
      !imageUrl ||
      !imageFileExtension
    );
  }

  protected async doAuthOperation(
    authOperation: () => Promise<[User, AuthToken]>,
    operationName: string,
  ) {
    await this.doFailureReportingOperation(async () => {
      this.view.setIsLoading(true);

      const [user, authToken] = await authOperation();

      this.view.updateUserInfo(user, authToken);
      this.view.navigate(`/feed/${user.alias}`);
    }, operationName);
    this.view.setIsLoading(false);
  }

  public abstract doAuth(
    alias: string,
    password: string,
    firstName?: string,
    lastName?: string,
    imageBytes?: Uint8Array,
    imageFileExtension?: string,
  ): Promise<void>;
}
