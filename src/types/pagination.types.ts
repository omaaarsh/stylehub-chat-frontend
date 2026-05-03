export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
}

export interface PaginationResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface CursorPaginationResponse<T> {
  items: T[];
  nextCursor: string | null;
}
