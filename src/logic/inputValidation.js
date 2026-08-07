const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{2}):(\d{2})$/;

export const parseDateParts = (value) => {
  const match = DATE_RE.exec((value || "").trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1800 || year > 2200 || month < 1 || month > 12) return null;
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) return null;
  return { year, month, day };
};

export const parseTimeParts = (value) => {
  if (!value) return null;
  const match = TIME_RE.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
};

export const validateAstrologyInput = ({ date, time, location }) => {
  const dateParts = parseDateParts(date);
  if (!dateParts) return { ok: false, error: "请输入有效日期（YYYY-MM-DD，年份 1800–2200）" };
  const timeParts = time ? parseTimeParts(time) : null;
  if (time && !timeParts) return { ok: false, error: "请输入有效时间（HH:mm，00:00–23:59）" };
  return { ok: true, dateParts, timeParts };
};
