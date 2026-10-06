/**
 * Ecosystem Stats Gate Tests
 *
 * Pure helpers behind the gated MODS nav item — the nav renders only once the
 * generated stats.json actually carries a real handful of mods.
 */

import { MODS_NAV_MIN, shouldShowModsNav } from '../useEcosystemStats';

describe('shouldShowModsNav', () => {
  it('hides the nav item while stats carry no mods data yet', () => {
    expect(shouldShowModsNav(undefined)).toBe(false);
    expect(shouldShowModsNav(0)).toBe(false);
  });

  it('shows the nav item at the threshold and beyond', () => {
    expect(MODS_NAV_MIN).toBeGreaterThan(1);
    expect(shouldShowModsNav(MODS_NAV_MIN)).toBe(true);
    expect(shouldShowModsNav(MODS_NAV_MIN + 1)).toBe(true);
  });

  it('hides the nav item below the threshold', () => {
    expect(shouldShowModsNav(MODS_NAV_MIN - 1)).toBe(false);
  });

  it('rejects non-numeric values', () => {
    expect(shouldShowModsNav('12' as unknown as number)).toBe(false);
    expect(shouldShowModsNav(NaN)).toBe(false);
  });
});
