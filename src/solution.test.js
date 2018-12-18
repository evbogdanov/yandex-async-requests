const parallelLimit = require('./solution');

describe('solution', () => {
  it('should solve the problem', done => {
    const urls = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
          limit = 3,
          expectedResults = urls.map(url => `OK: ${url}`);
    parallelLimit(urls, limit, results => {
      expect(results).toEqual(expectedResults);
      done();
    });
  });
});
