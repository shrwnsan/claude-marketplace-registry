import { displayCount, displayText } from '../display-values';

describe('displayText', () => {
  it('prefers the live client record', () => {
    expect(displayText('Live Name', 'Build Name', 'Fallback')).toBe('Live Name');
  });

  it('falls back to the build-time record when live is missing', () => {
    expect(displayText(undefined, 'Build Name', 'Fallback')).toBe('Build Name');
  });

  it('treats empty strings as missing', () => {
    expect(displayText('', 'Build Name', 'Fallback')).toBe('Build Name');
    expect(displayText('', '', 'Fallback')).toBe('Fallback');
  });

  it('uses the last-resort fallback when neither source has a value', () => {
    expect(displayText(undefined, undefined, 'Claude Code Plugin')).toBe('Claude Code Plugin');
  });

  it('supports empty-string fallbacks for optional byline fields', () => {
    expect(displayText(undefined, undefined, '')).toBe('');
  });
});

describe('displayCount', () => {
  it('prefers the live value', () => {
    expect(displayCount(3, 7)).toBe(3);
  });

  it('falls back to the build-time value when live is undefined', () => {
    expect(displayCount(undefined, 7)).toBe(7);
  });

  it('treats 0 as a real value, not missing', () => {
    expect(displayCount(0, 7)).toBe(0);
    expect(displayCount(undefined, 0)).toBe(0);
  });

  it('defaults to 0 when neither source has a value', () => {
    expect(displayCount(undefined, undefined)).toBe(0);
  });
});
