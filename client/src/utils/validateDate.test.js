import { describe, expect, it } from 'vitest';
import isValidateDate from './validateDate.js';

describe('isValidateDate', () => {
  it('accepts past dates by default', () => {
    expect(isValidateDate('01/01/2000')).toBe(true);
  });

  it('rejects future dates by default', () => {
    const nextYear = new Date().getFullYear() + 1;
    expect(isValidateDate(`01/01/${nextYear}`)).toBe(false);
  });

  it('accepts future dates up to end of current year + 2 when allowedFutur is enabled', () => {
    const maxYear = new Date().getFullYear() + 2;
    expect(isValidateDate(`31/12/${maxYear}`, { allowedFutur: true })).toBe(true);
  });

  it('rejects future dates beyond end of current year + 2 when allowedFutur is enabled', () => {
    const tooFarYear = new Date().getFullYear() + 3;
    expect(isValidateDate(`01/01/${tooFarYear}`, { allowedFutur: true })).toBe(false);
  });
});
