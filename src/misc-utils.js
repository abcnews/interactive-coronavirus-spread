export function clone(value) {
  if (typeof value !== 'object' || value === null) {
    return value;
  }

  const _value = Array.isArray(value) ? [] : {};

  for (const key in value) {
    _value[key] = clone(value[key]);
  }

  return _value;
}

export const getInclusiveDateFromYYYYMMDD = yyymmdd => {
  let [, yyyy, mm, dd] = String(yyymmdd).match(/(\d{4})(\d{2})(\d{2})/) || [];

  if (yyyy && mm && dd) {
    return new Date(`${yyyy}-${mm}-${dd}T23:59`);
  }
};
