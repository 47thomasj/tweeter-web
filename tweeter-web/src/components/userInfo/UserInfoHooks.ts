import { useContext } from "react";
import { AuthToken, User } from "tweeter-shared";
import { UserInfoActionsContext, UserInfoContext } from "./UserInfoContexts";

interface UserInfoActions {
    updateUserInfo: (
        currentUser: User,
        displayedUser: User | null,
        authToken: AuthToken,
        remember: boolean
    ) => void,
    clearUserInfo: () => void,
    setDisplayedUser: (user: User) => void,
}
  
export function useUserInfoActions(): UserInfoActions {
    return useContext(UserInfoActionsContext);
}

export function useUserInfo() {
    return useContext(UserInfoContext);
}
