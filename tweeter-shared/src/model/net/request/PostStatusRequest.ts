import { StatusDto } from "../../dto/StatusDto";

export interface PostStatusRequest {
    readonly token: string,
    readonly status: StatusDto,
}