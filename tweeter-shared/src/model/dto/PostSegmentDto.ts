import { Type } from "../domain/PostSegment";

export interface PostSegmentDto {
    text: string;
    startPosition: number;
    endPosition: number;
    type: Type;
}