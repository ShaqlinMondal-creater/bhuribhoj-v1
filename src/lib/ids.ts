export const nowIso = () => new Date().toISOString();

export const makeId = (prefix: string, ids: string[]) => {
  const next = ids.reduce((highest, id) => {
    const number = Number(id.replace(prefix, ""));
    return Number.isNaN(number) ? highest : Math.max(highest, number);
  }, 0) + 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
};
