import { UserDto } from "./UserDto";
import { PostSegmentDto } from "./PostSegmentDto";

export interface StatusDto {
    post: string;
    user: UserDto;
    timestamp: number;
    segments: PostSegmentDto[];
}