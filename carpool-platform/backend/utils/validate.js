// Indian mobile: exactly 10 digits, starting with 6–9
const PHONE_RE = /^[6-9]\d{9}$/;

function isValidPhone(phone) {
  return PHONE_RE.test(String(phone || '').trim());
}

function validateDepartureDate(departureAt) {
  const dep = new Date(departureAt);
  if (Number.isNaN(dep.getTime())) {
    return { ok: false, message: 'Invalid departure date' };
  }
  const now = new Date();
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  if (dep < now) {
    return { ok: false, message: 'Departure must be today or in the future' };
  }
  if (dep > maxDate) {
    return { ok: false, message: 'Departure cannot be more than 1 year from today' };
  }
  return { ok: true };
}

module.exports = { isValidPhone, validateDepartureDate };
