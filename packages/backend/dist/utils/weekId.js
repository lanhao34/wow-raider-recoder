"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeekId = getWeekId;
exports.calcDropCount = calcDropCount;
function getWeekId(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
function calcDropCount(difficulty, participantCount, extra = 0) {
    if (difficulty === 'mythic')
        return 4 + extra;
    return Math.max(1, Math.floor(participantCount / 5)) + extra;
}
