import { UserDto } from "../../dto/UserDto";
import { TweeterResponse } from "./TweeterResponse";

export interface GetUserResponse extends TweeterResponse {
    readonly user: UserDto | null;
}

export interface GetIsFollowerStatusResponse extends TweeterResponse {
    readonly isFollower: boolean;
}

export interface GetFolloweeCountResponse extends TweeterResponse {
    readonly followeeCount: number;
}

export interface GetFollowerCountResponse extends TweeterResponse {
    readonly followerCount: number;
}

export interface FollowActionResponse extends TweeterResponse {
    readonly followerCount: number;
    readonly followeeCount: number;
}
