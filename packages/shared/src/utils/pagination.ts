export interface CursorQuery {
  cursor?: string;
  take: number;
  skip?: number;
}

export interface OffsetQuery {
  skip: number;
  take: number;
}

export function buildCursorQuery(cursor: string | undefined, take: number): CursorQuery {
  if (cursor) {
    return { cursor, take: take + 1, skip: 1 };
  }
  return { take: take + 1 };
}

export function buildOffsetQuery(page: number, pageSize: number): OffsetQuery {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, Math.min(100, pageSize));
  return {
    skip: (safePage - 1) * safePageSize,
    take: safePageSize,
  };
}
