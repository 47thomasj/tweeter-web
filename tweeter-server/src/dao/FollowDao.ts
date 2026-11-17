import { UserDto } from "tweeter-shared";

export interface FollowDao {
    getFollowees(userId: string, pageSize: number, lastItem: string): Promise<UserDto[]>;
    getFollowers(userId: string, pageSize: number, lastItem: string): Promise<UserDto[]>;
}