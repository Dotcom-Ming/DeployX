"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCursorQuery = buildCursorQuery;
exports.buildOffsetQuery = buildOffsetQuery;
function buildCursorQuery(cursor, take) {
    if (cursor) {
        return { cursor, take: take + 1, skip: 1 };
    }
    return { take: take + 1 };
}
function buildOffsetQuery(page, pageSize) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, Math.min(100, pageSize));
    return {
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
    };
}
//# sourceMappingURL=pagination.js.map