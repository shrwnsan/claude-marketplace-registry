import { canonicalAuthor } from '../validate-plugins';

describe('canonicalAuthor', () => {
  it('returns the single declared author as the canonical by-line', () => {
    expect(canonicalAuthor(['Affaan Mustafa'])).toBe('Affaan Mustafa');
    expect(canonicalAuthor(['Affaan Mustafa', '', '   '])).toBe('Affaan Mustafa');
  });

  it('is case-insensitive but keeps the first-seen casing', () => {
    expect(canonicalAuthor(['Oxylabs', 'oxylabs', 'OXYLABS'.toLowerCase()])).toBe('Oxylabs');
    expect(canonicalAuthor(['useOSINT', 'UseOSINT'])).toBe('useOSINT');
  });

  it('returns null when authors are genuinely mixed (multi-vendor marketplaces)', () => {
    expect(canonicalAuthor(['Anthropic', 'Datadog', 'Anthropic'])).toBeNull();
    expect(canonicalAuthor([])).toBeNull();
  });
});
