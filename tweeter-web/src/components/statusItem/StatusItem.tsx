import { Link } from "react-router-dom";
import Post from "./Post";

interface StatusItemProps {
    item: any;
    featurePath: string;
    navigateToUser: (event: React.MouseEvent) => void;
}

export default function StatusItem({ item, featurePath, navigateToUser }: StatusItemProps) {
    return (
        <div className="col bg-light mx-0 px-0">
            <div className="container px-0">
            <div className="row mx-0 px-0">
                <div className="col-auto p-3">
                <img
                    src={item.user.imageUrl}
                    className="img-fluid"
                    width="80"
                    alt="Posting user"
                />
                </div>
                <div className="col">
                <h2>
                    <b>
                    {item.user.firstName} {item.user.lastName}
                    </b>{" "}
                    -{" "}
                    <Link
                    to={`${featurePath}/${item.user.alias}`}
                    onClick={navigateToUser}
                    >
                    {item.user.alias}
                    </Link>
                </h2>
                {item.formattedDate}
                <br />
                <Post status={item} featurePath={featurePath} />
                </div>
            </div>
            </div>
        </div>
    )
}