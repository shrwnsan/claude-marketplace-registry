import { pickQueryParams } from '../url-query';

describe('pickQueryParams', () => {
  it('keeps allowed params and drops param names outside the allowlist', () => {
    const query = pickQueryParams({ q: 'search', sort: 'name', utm_source: 'x', page: '3' }, {}, [
      'q',
      'sort',
    ]);
    expect(query).toEqual({ q: 'search', sort: 'name' });
  });

  it('lets the patch override the current query', () => {
    const query = pickQueryParams({ q: 'old', sort: 'name' }, { q: 'new' }, ['q', 'sort']);
    expect(query).toEqual({ q: 'new', sort: 'name' });
  });

  it('drops empty-string values so defaults clear out of the URL', () => {
    const query = pickQueryParams({ q: 'search', sort: 'name' }, { sort: '' }, ['q', 'sort']);
    expect(query).toEqual({ q: 'search' });
  });

  it('drops array values from repeated params', () => {
    const query = pickQueryParams({ q: ['a', 'b'] }, {}, ['q', 'sort']);
    expect(query).toEqual({});
  });

  it('drops prototype-pollution keys arriving as own properties', () => {
    // JSON.parse (unlike an object literal) creates real own "__proto__" /
    // "constructor" properties — the shape a crafted query string produces.
    const tainted = JSON.parse(
      '{"q":"search","__proto__":"x","constructor":"y","prototype":"z"}'
    ) as Record<string, string>;

    const query = pickQueryParams(tainted, {}, ['q', 'sort']);

    expect(query).toEqual({ q: 'search' });
    expect(Object.keys(query)).toEqual(['q']);
    expect(Object.getPrototypeOf(query)).toBe(Object.prototype);
  });
});
