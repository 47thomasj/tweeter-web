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
    const { updateUserInfo, clearUserInfo, setDisplayedUser } = useContext(UserInfoActionsContext);

    return {
        updateUserInfo: (currentUser: User, displayedUser: User | null, authToken: AuthToken, remember: boolean) => updateUserInfo(currentUser, displayedUser, authToken, remember),
        clearUserInfo: () => clearUserInfo(),
        setDisplayedUser: (user: User) => setDisplayedUser(user),
    }
}

export function useUserInfo() {
    return useContext(UserInfoContext);
}
