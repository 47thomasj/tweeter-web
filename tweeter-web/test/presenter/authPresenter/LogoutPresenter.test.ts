import { AuthToken } from "tweeter-shared";
import { LogoutPresenter, LogoutView } from "../../../src/presenter/authPresenter/LogoutPresenter";
import { anything, capture, instance, mock, spy, verify, when } from "@typestrong/ts-mockito";
import { AuthService } from "../../../src/model.service/AuthService";
describe("LogoutPresenter", () => {
    let mockLogoutView: LogoutView;
    let logoutPresenter: LogoutPresenter;
    let mockAuthService: AuthService;

    const authToken = new AuthToken("test-token", Date.now());
    beforeEach(() => {
        mockLogoutView = mock<LogoutView>();
        const mockLogoutViewInstance = instance(mockLogoutView);
        when(mockLogoutView.displayInfoMessage(anything(), 0)).thenReturn("test-message-id");

        const logoutPresenterSpy = spy(new LogoutPresenter(mockLogoutViewInstance));
        logoutPresenter = instance(logoutPresenterSpy);

        mockAuthService = mock<AuthService>();
        when(logoutPresenterSpy.service).thenReturn(instance(mockAuthService));
    })

    it("tells the view to display a logging out message", async () => {
        await logoutPresenter.logout(authToken);
        verify(mockLogoutView.displayInfoMessage("Logging Out...", 0)).once();
    })

    it("calls logout on the user service with the correct auth token", async () => {
        await logoutPresenter.logout(authToken);
        verify(mockAuthService.logout(authToken)).once();
    })

    it("tells the view to clear the info message that was displayed previously, clear the user info, and navigate to the login page when successful", async () => {
        await logoutPresenter.logout(authToken);

        verify(mockLogoutView.displayErrorMessage(anything())).never();
        verify(mockLogoutView.deleteMessage("test-message-id")).once();
        verify(mockLogoutView.clearUserInfo()).once();
        verify(mockLogoutView.navigate("/login")).once();
    })

    it("tells the view to display an error message and does not tell it to clear the info message, clear the user info or navigate to the login page when not successful", async () => {
        const error = new Error("Logout failed");
        when(mockAuthService.logout(anything())).thenThrow(error);
        await logoutPresenter.logout(authToken);

        verify(mockLogoutView.displayErrorMessage("Failed to log user out because of an exception: Logout failed")).once();
        verify(mockLogoutView.deleteMessage(anything())).never();
        verify(mockLogoutView.clearUserInfo()).never();
        verify(mockLogoutView.navigate("/login")).never();
    })
});