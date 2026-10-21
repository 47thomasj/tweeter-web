import { PostPresenter, PostView } from "../../src/presenter/PostPresenter";
import { StatusService } from "../../src/model.service/StatusService";
import { AuthToken, Status, User } from "tweeter-shared";
import { instance, mock, spy, when, anything, verify, capture } from "@typestrong/ts-mockito";

describe("PostPresenter", () => {
    let mockPostView: PostView;
    let postPresenter: PostPresenter;
    let mockStatusService: StatusService;

    const authToken = new AuthToken("test-token", Date.now());
    const user = new User("firstname", "lastname", "alias", "uri");
    beforeEach(() => {
        mockPostView = mock<PostView>();
        const mockPostViewInstance = instance(mockPostView);
        when(mockPostView.displayInfoMessage(anything(), 0)).thenReturn("test-message-id");

        const postPresenterSpy = spy(new PostPresenter(mockPostViewInstance, authToken));
        postPresenter = instance(postPresenterSpy);

        mockStatusService = mock<StatusService>();
        when(postPresenterSpy.service).thenReturn(instance(mockStatusService));
    })

    it("tells the view to display a posting status message", async () => {
        await postPresenter.submitPost("test-post", user);
        verify(mockPostView.displayInfoMessage("Posting status...", 0)).once();
    })

    it("calls postStatus on the post status service with the correct status string and auth token", async () => {
        await postPresenter.submitPost("test-post", user);
        verify(mockStatusService.postStatus(authToken, anything())).once();

        let [_, status] = capture(mockStatusService.postStatus).last();
        expect(status.post).toBe("test-post");
    })

    it("tells the view to clear the info message that was displayed previously, clear the post, and display a status posted messagew when successful", async () => {
        await postPresenter.submitPost("test-post", user);
        verify(mockPostView.deleteMessage("test-message-id")).once();
        verify(mockPostView.setPost("")).once();
        verify(mockPostView.displayInfoMessage("Status posted!", 2000)).once();
    })

    it("tells the view to clear the info message and display an error message but does not tell it to clear the post or display a status posted message when not successful", async () => {
        const error = new Error("Post failed");
        when(mockStatusService.postStatus(anything(), anything())).thenThrow(error);
        await postPresenter.submitPost("test-post", user);
        verify(mockPostView.deleteMessage("test-message-id")).once();
        verify(mockPostView.setPost("")).never();
        verify(mockPostView.displayInfoMessage("Status posted!", 2000)).never();
        verify(mockPostView.displayErrorMessage("Failed to post the status because of an exception: Post failed")).once();
    })
})