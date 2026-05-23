import { buildCursorQuery, buildOffsetQuery } from './pagination';

describe('Pagination Utils', () => {
  describe('buildCursorQuery', () => {
    it('should return query with cursor when cursor is provided', () => {
      const result = buildCursorQuery('cursor-123', 10);

      expect(result).toEqual({
        cursor: 'cursor-123',
        take: 11,
        skip: 1,
      });
    });

    it('should return query without cursor when cursor is undefined', () => {
      const result = buildCursorQuery(undefined, 10);

      expect(result).toEqual({
        take: 11,
      });
    });

    it('should add 1 to take for hasMore detection', () => {
      const result = buildCursorQuery(undefined, 25);

      expect(result.take).toBe(26);
    });
  });

  describe('buildOffsetQuery', () => {
    it('should calculate correct skip for given page and pageSize', () => {
      const result = buildOffsetQuery(3, 10);

      expect(result).toEqual({
        skip: 20,
        take: 10,
      });
    });

    it('should handle page 1', () => {
      const result = buildOffsetQuery(1, 20);

      expect(result).toEqual({
        skip: 0,
        take: 20,
      });
    });

    it('should enforce minimum page size of 1', () => {
      const result = buildOffsetQuery(1, 0);

      expect(result.take).toBe(1);
    });

    it('should enforce maximum page size of 100', () => {
      const result = buildOffsetQuery(1, 200);

      expect(result.take).toBe(100);
    });

    it('should enforce minimum page of 1', () => {
      const result = buildOffsetQuery(-1, 10);

      expect(result.skip).toBe(0);
    });
  });
});
