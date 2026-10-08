import "./AppNavbar.css";
import { useUserInfoActions } from "../userInfo/UserInfoHooks";
import { Container, Nav, Navbar } from "react-bootstrap";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Image from "react-bootstrap/Image";
import { useMessageActions } from "../toaster/MessageHooks";
import { useUserInfo } from "../userInfo/UserInfoHooks";
import { LogoutPresenter, LogoutView } from "../../presenter/authPresenter/LogoutPresenter";
import { useRef } from "react";

const AppNavbar = () => {
  const location = useLocation();
  const { authToken, displayedUser } = useUserInfo();
  const { clearUserInfo } = useUserInfoActions();
  const navigate = useNavigate();
  const { displayErrorMessage, displayInfoMessage, deleteMessage } = useMessageActions();

  const listener: LogoutView = {
    deleteMessage: deleteMessage,
    displayInfoMessage: displayInfoMessage,
    displayErrorMessage: displayErrorMessage,
    navigate: navigate,
    clearUserInfo: clearUserInfo,
  };

  const presenterRef = useRef<LogoutPresenter | null>(null);
  if (!presenterRef.current) {
    presenterRef.current = new LogoutPresenter(listener);
  }
  

  return (
    <Navbar
      collapseOnSelect
      className="mb-4"
      expand="md"
      bg="primary"
      variant="dark"
    >
      <Container>
        <Navbar.Brand>
          <div className="d-flex flex-row">
            <div className="p-2">
              <NavLink className="brand-link" to="/">
                <Image src={"/bird-white-32.png"} alt="" />
              </NavLink>
            </div>
            <div id="brand-title" className="p-3">
              <NavLink className="brand-link" to="/">
                <b>Tweeter</b>
              </NavLink>
            </div>
          </div>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="ml-auto">
            <Nav.Item>
              <NavLink
                to={`/feed/${displayedUser!.alias}`}
                className={() =>
                  location.pathname.startsWith("/feed/")
                    ? "nav-link active"
                    : "nav-link"
                }
              >
                Feed
              </NavLink>
            </Nav.Item>
            <Nav.Item>
              <NavLink
                to={`/story/${displayedUser!.alias}`}
                className={() =>
                  location.pathname.startsWith("/story/")
                    ? "nav-link active"
                    : "nav-link"
                }
              >
                Story
              </NavLink>
            </Nav.Item>
            <Nav.Item>
              <NavLink
                to={`/followees/${displayedUser!.alias}`}
                className={() =>
                  location.pathname.startsWith("/followees/")
                    ? "nav-link active"
                    : "nav-link"
                }
              >
                Followees
              </NavLink>
            </Nav.Item>
            <Nav.Item>
              <NavLink
                to={`/followers/${displayedUser!.alias}`}
                className={() =>
                  location.pathname.startsWith("/followers/")
                    ? "nav-link active"
                    : "nav-link"
                }
              >
                Followers
              </NavLink>
            </Nav.Item>
            <Nav.Item>
              <NavLink
                id="logout"
                onClick={() => presenterRef.current!.logout(authToken!)}
                to={location.pathname}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Logout
              </NavLink>
            </Nav.Item>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
