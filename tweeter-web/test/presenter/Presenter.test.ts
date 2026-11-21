// Partially written by AI.

import { UserFacingError } from "../../src/model/UserFacingError";
import { Presenter, View } from "../../src/presenter/Presenter";

class TestPresenter extends Presenter<View> {
  public constructor(view: View) {
    super(view);
  }

  public async report(error: Error): Promise<void> {
    await this.doFailureReportingOperation(async () => {
      throw error;
    }, "perform test operation");
  }
}

describe("Presenter", () => {
  const displayErrorMessage = jest.fn();
  const presenter = new TestPresenter({ displayErrorMessage });

  beforeEach(() => {
    displayErrorMessage.mockClear();
  });

  it("displays only the message from a user-facing error", async () => {
    await presenter.report(new UserFacingError("Invalid alias"));

    expect(displayErrorMessage).toHaveBeenCalledWith("Invalid alias");
  });

  it("keeps operation context for unexpected errors", async () => {
    await presenter.report(new Error("Unexpected failure"));

    expect(displayErrorMessage).toHaveBeenCalledWith(
      "Failed to perform test operation because of an exception: Unexpected failure",
    );
  });
});
