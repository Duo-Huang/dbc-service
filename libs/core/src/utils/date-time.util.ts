import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// 扩展 dayjs 插件
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 格式化为东八区时间（北京时间）
 * @param date 可选的日期对象，默认为当前时间
 * @param format 时间格式，默认为 'YYYY-MM-DD HH:mm:ss.SSS'
 * @returns 格式化后的时间字符串
 */
export function formatBeijingTime(
    date?: Date,
    format: string = 'YYYY-MM-DD HH:mm:ss.SSS',
): string {
    const time = date ? dayjs(date) : dayjs();
    return time.tz('Asia/Shanghai').format(format);
}

/**
 * 获取当前东八区时间的 Date 对象
 * @returns Date 对象
 */
export function getBeijingTime(): Date {
    return dayjs().tz('Asia/Shanghai').toDate();
}

/**
 * 将任意时区的时间转换为东八区时间
 * @param date 日期对象或日期字符串
 * @returns 东八区时间的 Date 对象
 */
export function toBeijingTime(date: Date | string): Date {
    return dayjs(date).tz('Asia/Shanghai').toDate();
}
