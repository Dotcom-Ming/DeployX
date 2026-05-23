export interface CursorQuery {
    cursor?: string;
    take: number;
    skip?: number;
}
export interface OffsetQuery {
    skip: number;
    take: number;
}
export declare function buildCursorQuery(cursor: string | undefined, take: number): CursorQuery;
export declare function buildOffsetQuery(page: number, pageSize: number): OffsetQuery;
//# sourceMappingURL=pagination.d.ts.map