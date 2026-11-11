import { UserDto } from "../../dto/UserDto";
import { TweeterRequest } from "../request/TweeterRequest";

export interface UserRequest extends TweeterRequest{
    token: string;
}

export interface GetUserRequest extends UserRequest {
  alias: string;
}

export interface GetFollowCountRequest extends UserRequest {
  user: UserDto;
}

export interface GetIsFollowerStatusRequest extends GetFollowCountRequest {
  selectedUser: UserDto;
}

export interface FollowRequest extends UserRequest {
  userToFollow: UserDto;
}
export interface UnfollowRequest extends UserRequest {
  userToUnfollow: UserDto;
}
