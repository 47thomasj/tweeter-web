// Partially written by AI.

import { UserFacingError } from "../model/UserFacingError";

export interface View {
  displayErrorMessage(message: string): void;
}

export interface MessageView extends View {
  displayInfoMessage(message: string, timeout: number): string;
  deleteMessage(message: string): void;
}

export abstract class Presenter<V extends View> {
  private _view: V;
  protected constructor(view: V) {
    this._view = view;
  }

  protected async doFailureReportingOperation(operation: () => Promise<void>, operationDescription: string) {
    try {
      await operation();
    } catch (error) {
      this._view.displayErrorMessage(
        error instanceof UserFacingError
          ? error.message
          : `Failed to ${operationDescription} because of an exception: ${(error as Error).message}`,
      );
    }
  }

  protected get view(): V {
    return this._view;
  }
}
