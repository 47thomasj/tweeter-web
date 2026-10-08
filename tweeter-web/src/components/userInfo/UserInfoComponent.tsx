import "./UserInfoComponent.css";
import { useUserInfo, useUserInfoActions } from "./UserInfoHooks";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User } from "tweeter-shared";
import { useMessageActions } from "../toaster/MessageHooks";
import { UserInfoPresenter, UserInfoView } from "../../presenter/UserInfoPresenter";

const UserInfo = () => {
  const { displayInfoMessage, displayErrorMessage, deleteMessage } =
    useMessageActions();

  const { currentUser, authToken, displayedUser } = useUserInfo();
  const { setDisplayedUser } = useUserInfoActions();
  const navigate = useNavigate();

  const [isFollower, setIsFollower] = useState(false);
  const [loading, setIsLoading] = useState(false);
  const [followeeCount, setFolloweeCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);

  const listener: UserInfoView = {
    setDisplayedUser: (user: User) => setDisplayedUser(user),
    navigate: (url: string) => navigate(url),
    displayInfoMessage: (message: string, timeout: number) => displayInfoMessage(message, timeout),
    displayErrorMessage: (message: string) => displayErrorMessage(message),
    deleteMessage: (message: string) => deleteMessage(message),
    setIsFollower: (isFollower: boolean) => setIsFollower(isFollower),
    setIsLoading: (isLoading: boolean) => setIsLoading(isLoading),
    setFollowerCount: (followerCount: number) => setFollowerCount(followerCount),
    setFolloweeCount: (followeeCount: number) => setFolloweeCount(followeeCount),
  }

  const presenterRef = useRef<UserInfoPresenter | null>(null);
  if (!presenterRef.current) {
    presenterRef.current = new UserInfoPresenter(listener, currentUser!, authToken!);
  }

  if (!displayedUser) {
    setDisplayedUser(currentUser!);
  }

  useEffect(() => {
    presenterRef.current!.setIsFollowerStatus(authToken!, currentUser!, displayedUser!);
    presenterRef.current!.setNumbFollowees(authToken!, displayedUser!);
    presenterRef.current!.setNumbFollowers(authToken!, displayedUser!);
  }, [displayedUser]);


  const switchToLoggedInUser = (event: React.MouseEvent): void => {
    event.preventDefault();
    presenterRef.current!.switchToLoggedInUser();
  };

  const followDisplayedUser = async (
    event: React.MouseEvent,
  ): Promise<void> => {
    event.preventDefault();
    presenterRef.current!.followUser(displayedUser!);
  };

  const unfollowDisplayedUser = async (
    event: React.MouseEvent,
  ): Promise<void> => {
    event.preventDefault();
    presenterRef.current!.unfollowUser(displayedUser!);
  };

  return (
    <>
      {currentUser === null || displayedUser === null || authToken === null ? (
        <></>
      ) : (
        <div className="container">
          <div className="row">
            <div className="col-auto p-3">
              <img
                src={displayedUser.imageUrl}
                className="img-fluid"
                width="100"
                alt="Posting user"
              />
            </div>
            <div className="col p-3">
              {!displayedUser.equals(currentUser) && (
                <p id="returnToLoggedInUser">
                  Return to{" "}
                  <Link
                    to={`./${currentUser.alias}`}
                    onClick={switchToLoggedInUser}
                  >
                    logged in user
                  </Link>
                </p>
              )}
              <h2>
                <b>{displayedUser.name}</b>
              </h2>
              <h3>{displayedUser.alias}</h3>
              <br />
              {followeeCount > -1 && followerCount > -1 && (
                <div>
                  Followees: {followeeCount} Followers: {followerCount}
                </div>
              )}
            </div>
            <form>
              {!displayedUser.equals(currentUser) && (
                <div className="form-group">
                  {isFollower ? (
                    <button
                      id="unFollowButton"
                      className="btn btn-md btn-secondary me-1"
                      type="submit"
                      style={{ width: "6em" }}
                      disabled={loading}
                      onClick={unfollowDisplayedUser}
                    >
                      {loading ? (
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                      ) : (
                        <div>Unfollow</div>
                      )}
                    </button>
                  ) : (
                    <button
                      id="followButton"
                      className="btn btn-md btn-primary me-1"
                      type="submit"
                      style={{ width: "6em" }}
                      disabled={loading}
                      onClick={followDisplayedUser}
                    >
                      {loading ? (
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                      ) : (
                        <div>Follow</div>
                      )}
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default UserInfo;
