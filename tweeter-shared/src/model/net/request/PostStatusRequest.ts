import { StatusDto } from "../../dto/StatusDto";
import { TweeterRequest } from "../request/TweeterRequest";

export interface PostStatusRequest extends TweeterRequest {
    readonly token: string,
    readonly status: StatusDto,
}