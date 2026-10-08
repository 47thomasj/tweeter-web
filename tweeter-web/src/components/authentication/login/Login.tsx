import "./Login.css";
import "bootstrap/dist/css/bootstrap.css";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthenticationFormLayout from "../AuthenticationFormLayout";
import AuthenticationFields from "../AuthenticationFields";
import { useMessageActions } from "../../toaster/MessageHooks";
import { useUserInfoActions } from "../../userInfo/UserInfoHooks";
import { AuthView, AuthPresenter } from "../../../presenter/authPresenter/AuthPresenter";
import { AuthToken, User } from "tweeter-shared";

interface Props {
  originalUrl?: string;
  presenterFactory: (view: AuthView) => AuthPresenter;
}

const Login = (props: Props) => {
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const { updateUserInfo } = useUserInfoActions();
  const { displayErrorMessage } = useMessageActions();
  const navigate = useNavigate();  

  const listener: AuthView = {
    updateUserInfo: (user: User, authToken: AuthToken) => updateUserInfo(user, user, authToken, rememberMe),
    navigate: (url: string) => navigate(url),
    displayErrorMessage: displayErrorMessage,
    setIsLoading: (isLoading: boolean) => setLoading(isLoading),
  };

  const presenterRef = useRef<AuthPresenter | null>(null);
  if (!presenterRef.current) {
    presenterRef.current = props.presenterFactory(listener);
  }

  const inputFieldFactory = () => {
    return (
      <AuthenticationFields
        doOnEnter={() => presenterRef.current!.doAuth(alias, password)}
        checkSubmitButtonStatus={() => presenterRef.current!.checkSubmitButtonStatus(alias, password)}
        setAlias={setAlias}
        setPassword={setPassword}
      />          
    );
  };

  const switchAuthenticationMethodFactory = () => {
    return (
      <div className="mb-3">
        Not registered? <Link to="/register">Register</Link>
      </div>
    );
  };

  return (
    <AuthenticationFormLayout
      headingText="Please Sign In"
      submitButtonLabel="Sign in"
      oAuthHeading="Sign in with:"
      inputFieldFactory={inputFieldFactory}
      switchAuthenticationMethodFactory={switchAuthenticationMethodFactory}
      setRememberMe={setRememberMe}
      submitButtonDisabled={() => presenterRef.current!.checkSubmitButtonStatus(alias, password)}
      isLoading={loading}
      submit={() => presenterRef.current!.doAuth(alias, password)}
    />
  );
};

export default Login;
