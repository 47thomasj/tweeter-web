import { UserDto } from "../../dto/UserDto";
import { TweeterRequest } from "../request/TweeterRequest";

export interface PagedUserItemRequest extends TweeterRequest {
    readonly token: string,
    readonly userAlias: string,
    readonly pageSize: number,
    readonly lastItem: UserDto | null,
}