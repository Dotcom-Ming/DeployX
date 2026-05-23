"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatRelativeTime = formatRelativeTime;
exports.formatDuration = formatDuration;
function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    if (diffSeconds < 0) {
        return "just now";
    }
    if (diffSeconds < 60) {
        return diffSeconds <= 1 ? "just now" : `${diffSeconds} seconds ago`;
    }
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
        return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
        return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) {
        return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
    }
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
        return diffMonths === 1 ? "1 month ago" : `${diffMonths} months ago`;
    }
    const diffYears = Math.floor(diffDays / 365);
    return diffYears === 1 ? "1 year ago" : `${diffYears} years ago`;
}
function formatDuration(seconds) {
    if (seconds < 0) {
        seconds = 0;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const parts = [];
    if (hours > 0) {
        parts.push(`${hours}h`);
    }
    if (minutes > 0 || hours > 0) {
        parts.push(`${minutes}m`);
    }
    parts.push(`${secs}s`);
    return parts.join(" ");
}
//# sourceMappingURL=date.js.map