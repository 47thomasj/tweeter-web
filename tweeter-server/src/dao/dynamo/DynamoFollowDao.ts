import { FollowDao } from "../FollowDao";
import { UserDto } from "tweeter-shared";

export class DynamoFollowDao implements FollowDao {
    public async getFollowees(userId: string, pageSize: number, lastItem: string): Promise<UserDto[]> {
        return [];
    }

    public async getFollowers(userId: string, pageSize: number, lastItem: string): Promise<UserDto[]> {
        return [];
    }
}