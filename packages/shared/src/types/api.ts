export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    total?: number;
  };
  timestamp: string;
}

export interface PaginationParams {
  cursor?: string;
  take?: number;
  page?: number;
  pageSize?: number;
}

export interface CursorPaginationParams {
  cursor?: string;
  take: number;
}

export interface OffsetPaginationParams {
  page: number;
  pageSize: number;
}
