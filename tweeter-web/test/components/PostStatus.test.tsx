import { render, screen } from "@testing-library/react";
import PostStatus from "../../src/components/postStatus/PostStatus";
import { PostPresenter } from "../../src/presenter/PostPresenter";
import userEvent from "@testing-library/user-event";
import { anything, instance, mock, verify, when } from "@typestrong/ts-mockito";
import "@testing-library/jest-dom";

describe("PostStatus", () => {
  it("starts with the post status and clear buttons disabled", () => {
    const { postStatusButton, clearStatusButton } =
      renderPostStatusAndGetElements(mock<PostPresenter>());

    expect(postStatusButton).toBeDisabled();
    expect(clearStatusButton).toBeDisabled();
  });

  it("enables both buttons when the text field has text", async () => {
    const { user, postStatusButton, clearStatusButton, textField } =
      renderPostStatusAndGetElements(mock<PostPresenter>());

    await user.type(textField, "test");

    expect(postStatusButton).toBeEnabled();
    expect(clearStatusButton).toBeEnabled();
  });

  it("disables both buttons when the text field is cleared", async () => {
    const { user, postStatusButton, clearStatusButton, textField } =
      renderPostStatusAndGetElements(mock<PostPresenter>());

    await user.type(textField, "test");
    await user.clear(textField);

    expect(postStatusButton).toBeDisabled();
    expect(clearStatusButton).toBeDisabled();
  });

  it("calls the presnter's postStatus method with the correct parameters when the Post Status button is pressed", async () => {
    const mockPresenter = mock<PostPresenter>();
    const { user, postStatusButton, textField } =
      renderPostStatusAndGetElements(mockPresenter);

    await user.type(textField, "test");
    await user.click(postStatusButton);
    verify(mockPresenter.submitPost("test", anything())).once();
  });
});

function renderPostStatus(presenter: PostPresenter) {
  when(
    presenter.checkButtonStatus(anything(), anything(), anything()),
  ).thenCall((post: string) => !post);
  return render(<PostStatus presenter={instance(presenter)} />);
}

function renderPostStatusAndGetElements(presenter?: PostPresenter) {
  const user = userEvent.setup();
  renderPostStatus(presenter ?? mock<PostPresenter>());

  const postStatusButton = screen.getByRole("button", { name: /Post Status/i });
  const clearStatusButton = screen.getByRole("button", { name: /clear/i });
  const textField = screen.getByRole("textbox", { name: /post status/i });

  return { user, postStatusButton, clearStatusButton, textField };
}
