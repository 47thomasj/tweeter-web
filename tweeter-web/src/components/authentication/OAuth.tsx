import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import useMessageActions from "../toaster/MessageHooks";

export default function OAuth() {
    const { displayInfoMessage } = useMessageActions();
    const displayInfoMessageWithDarkBackground = (message: string): void => {
        displayInfoMessage(
          message,
          3000,
          "text-white bg-primary"
        );
      };
      
    function oauthButtonFactory(provider: string): JSX.Element {
        return (
            <button
                type="button"
                className="btn btn-link btn-floating mx-1"
                onClick={() =>
                displayInfoMessageWithDarkBackground(
                    `${provider} registration is not implemented.`
                )
                }
            >
                <OverlayTrigger
                placement="top"
                overlay={<Tooltip id={`${provider.toLowerCase()}Tooltip`}>{provider}</Tooltip>}
                >
                <FontAwesomeIcon icon={["fab", provider.toLowerCase() as IconName]} />
                </OverlayTrigger>
            </button>
        )
    }

    return (
        <>
        {oauthButtonFactory("Google")}
        {oauthButtonFactory("Facebook")}
        {oauthButtonFactory("Twitter")}
        {oauthButtonFactory("LinkedIn")}
        {oauthButtonFactory("GitHub")}
        </>
    )
}