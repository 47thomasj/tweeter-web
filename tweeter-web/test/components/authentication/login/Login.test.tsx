import { MemoryRouter } from "react-router-dom";
import Login from "../../../../src/components/authentication/login/Login";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthView } from "../../../../src/presenter/authPresenter/AuthPresenter";
import { LoginPresenter } from "../../../../src/presenter/authPresenter/LoginPresenter";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import "@testing-library/jest-dom";
import { anything, instance, mock, verify, when } from "@typestrong/ts-mockito";

library.add(fab);

describe("Login", () => {
  it("starts with the sign in button disabled", () => {
    const { signInButton } = renderLoginAndGetElements("");
    expect(signInButton).toBeDisabled();
  });

  it("enables the sign in button if both alias an dpassword fields hav test", async () => {
    const { user, signInButton, aliasField, passwordField } =
      renderLoginAndGetElements("");

    await user.type(aliasField, "a");
    await user.type(passwordField, "b");

    expect(signInButton).toBeEnabled();
  });

  it("disables the sign in button if either the alias or password fields is cleared", async () => {
    const { user, signInButton, aliasField, passwordField } =
      renderLoginAndGetElements("");

    await user.type(aliasField, "a");
    await user.type(passwordField, "b");
    expect(signInButton).toBeEnabled();

    await user.clear(aliasField);
    expect(signInButton).toBeDisabled();

    await user.type(aliasField, "a");
    await user.clear(passwordField);
    expect(signInButton).toBeDisabled();

    await user.clear(aliasField);
    expect(signInButton).toBeDisabled();
  });

  it("calls the presenter's login method with correct parameters when the sign-in button is pressed", async () => {
    const mockPresenter = mock<LoginPresenter>();
    const { user, signInButton, aliasField, passwordField } = renderLoginAndGetElements("", mockPresenter);

    const alias = "a";
    const password = "b";

    await user.type(aliasField, alias);
    await user.type(passwordField, password);

    await user.click(signInButton);

    verify(mockPresenter.doAuth(alias, password)).once();
  });
});

function renderLogin(originalUrl: string, presenter: LoginPresenter) {
  const presenterFactory = (view: AuthView) => {
    when(
      presenter.checkSubmitButtonStatus(anything(), anything()),
    ).thenCall((alias: string, password: string) => !alias || !password);
    return instance(presenter);
  };
  return render(
    <MemoryRouter>
      <Login originalUrl={originalUrl} presenterFactory={presenterFactory} />
    </MemoryRouter>,
  );
}

function renderLoginAndGetElements(originalUrl: string, presenter?: LoginPresenter) {
  const user = userEvent.setup();
  renderLogin(originalUrl, presenter ?? mock<LoginPresenter>());

  const signInButton = screen.getByRole("button", { name: /Sign in/i });
  const aliasField = screen.getByLabelText("alias");
  const passwordField = screen.getByLabelText("password");

  return { user, signInButton, aliasField, passwordField };
}
