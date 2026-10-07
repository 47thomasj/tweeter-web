import "./Register.css";
import "bootstrap/dist/css/bootstrap.css";
import { ChangeEvent, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthenticationFormLayout from "../AuthenticationFormLayout";
import { AuthToken, User } from "tweeter-shared";
import AuthenticationFields from "../AuthenticationFields";
import { useMessageActions } from "../../toaster/MessageHooks";
import { useUserInfoActions } from "../../userInfo/UserInfoHooks";
import { RegisterView } from "../../../presenter/authPresenter/RegisterPresenter";
import { RegisterPresenter } from "../../../presenter/authPresenter/RegisterPresenter";

interface Props {
  presenterFactory: (view: RegisterView) => RegisterPresenter;
}

const Register = (props: Props) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [imageBytes, setImageBytes] = useState<Uint8Array>(new Uint8Array());
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageFileExtension, setImageFileExtension] = useState<string>("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { updateUserInfo } = useUserInfoActions();
  const { displayErrorMessage } = useMessageActions();

  const listener: RegisterView = {
    updateUserInfo: (user: User, authToken: AuthToken) =>
      updateUserInfo(user, user, authToken, rememberMe),
    navigate: (url: string) => navigate(url),
    displayErrorMessage: displayErrorMessage,
    setImageUrl: setImageUrl,
    setImageBytes: setImageBytes,
    setImageFileExtension: setImageFileExtension,
  };

  const presenterRef = useRef<RegisterPresenter | null>(null);
  if (!presenterRef.current) {
    presenterRef.current = props.presenterFactory(listener);
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    presenterRef.current!.convertFileToBytes(file);
  };

  const doRegister = async () => {
    presenterRef.current!.doAuth(
      firstName,
      lastName,
      alias,
      password,
      imageBytes,
      imageFileExtension,
    );
  };

  const checkSubmitButtonStatus = () => {
    return presenterRef.current!.checkSubmitButtonStatus(
      firstName,
      lastName,
      alias,
      password,
      imageUrl,
      imageFileExtension,
    );
  };

  const inputFieldFactory = () => {
    return (
      <AuthenticationFields
        doOnEnter={doRegister}
        checkSubmitButtonStatus={checkSubmitButtonStatus}
        setFirstName={setFirstName}
        setLastName={setLastName}
        setAlias={setAlias}
        setPassword={setPassword}
        handleFileChange={handleFileChange}
        imageUrl={imageUrl}
      />
    );
  };

  const switchAuthenticationMethodFactory = () => {
    return (
      <div className="mb-3">
        Algready registered? <Link to="/login">Sign in</Link>
      </div>
    );
  };

  return (
    <AuthenticationFormLayout
      headingText="Please Register"
      submitButtonLabel="Register"
      oAuthHeading="Register with:"
      inputFieldFactory={inputFieldFactory}
      switchAuthenticationMethodFactory={switchAuthenticationMethodFactory}
      setRememberMe={setRememberMe}
      submitButtonDisabled={checkSubmitButtonStatus}
      isLoading={isLoading}
      submit={doRegister}
    />
  );
};

export default Register;
