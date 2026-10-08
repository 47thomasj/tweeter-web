import { AuthPresenter, AuthView } from "./AuthPresenter";
import { Buffer } from "buffer";

export interface RegisterView extends AuthView {
  setImageUrl: (url: string) => void;
  setImageBytes: (bytes: Uint8Array) => void;
  setImageFileExtension: (extension: string) => void;
}

export class RegisterPresenter extends AuthPresenter {
  public constructor(view: RegisterView) {
    super(view, undefined);
  }

  public convertFileToBytes(file: File | undefined) {
    if (file) {
      this.view.setImageUrl!(URL.createObjectURL(file));

      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const imageStringBase64 = event.target?.result as string;

        // Remove unnecessary file metadata from the start of the string.
        const imageStringBase64BufferContents =
          imageStringBase64.split("base64,")[1];

        const bytes: Uint8Array = Buffer.from(
          imageStringBase64BufferContents,
          "base64",
        );

        this.view.setImageBytes!(bytes);
      };
      reader.readAsDataURL(file);

      // Set image file extension (and move to a separate method)
      const fileExtension = this.getFileExtension(file);
      if (fileExtension) {
        this.view.setImageFileExtension!(fileExtension);
      }
    } else {
      this.view.setImageUrl!("");
      this.view.setImageBytes!(new Uint8Array());
    }
  }

  public getFileExtension = (file: File): string | undefined => {
    return file.name.split(".").pop();
  };

  public async doAuth(
    firstName: string,
    lastName: string,
    alias: string,
    password: string,
    imageBytes: Uint8Array,
    imageFileExtension: string,
  ) {
    try {
      this.view.setIsLoading(true);

      const [user, authToken] = await this.authService.register(
        firstName,
        lastName,
        alias,
        password,
        imageBytes,
        imageFileExtension,
      );

      this.view.updateUserInfo(user, authToken);
      this.view.navigate(`/feed/${user.alias}`);
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to register user because of exception: ${error}`,
      );
    } finally {
      this.view.setIsLoading(false);
    }
  }
}
