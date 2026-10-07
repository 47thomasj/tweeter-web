import { useNavigate } from "react-router-dom";
import { useUserInfo, useUserInfoActions } from "../userInfo/UserInfoHooks";
import { useMessageActions } from "../toaster/MessageHooks";
import {
  UserNavigationPresenter,
  UserNavigationView,
} from "../../presenter/UserNavigationPresenter";
import { useRef } from "react";

interface UserNavigation {
  navigateToUser: (
    event: React.MouseEvent,
    featurePath: string,
  ) => Promise<void>;
  extractAlias: (value: string) => string;
}

export function useUserNavigation(): UserNavigation {
  const { displayErrorMessage } = useMessageActions();
  const { displayedUser, authToken } = useUserInfo();
  const { setDisplayedUser } = useUserInfoActions();

  const navigate = useNavigate();

  const listener: UserNavigationView = {
    setDisplayedUser: setDisplayedUser,
    navigate: navigate,
    displayErrorMessage: displayErrorMessage,
  };

  const presenterRef = useRef<UserNavigationPresenter | null>(null);
  if (!presenterRef.current) {
    presenterRef.current = new UserNavigationPresenter(
      listener,
      authToken!,
      displayedUser!,
    );
  }

  const navigateToUser = async (
    event: React.MouseEvent,
    featurePath: string,
  ): Promise<void> => {
    event.preventDefault();
    await presenterRef.current!.navigateToUser(
      event.target.toString(),
      featurePath,
    );
  };

  return {
    navigateToUser,
    extractAlias: presenterRef.current!.extractAlias,
  };
}
