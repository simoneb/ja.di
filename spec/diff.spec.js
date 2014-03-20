var jadi = jadi || require('../ja.di'),
    _ = _ || require('lodash');

describe('simple types', function () {

  describe('identities', function () {
    it('Number', function () {
      expect(jadi.diff(1, 1)).toBeUndefined();
    });

    it('String', function () {
      expect(jadi.diff('a', 'a')).toBeUndefined();
    });

    it('Date', function () {
      var time = new Date().getTime();

      expect(jadi.diff(new Date(time), new Date(time))).toBeUndefined();
    });

    it('Boolean', function () {
      expect(jadi.diff(true, true)).toBeUndefined();
    });
  });

  describe('differences when comparing objects of the same type', function() {
    it('Number', function() {
      expect(jadi.diff(1, 2)).toEqual({ _left: 1, _right: 2 });
    });

    it('String', function() {
      expect(jadi.diff('a', 'bcd')).toEqual({ _left: 'a', _right: 'bcd' });
    });

    it('Date', function() {
      var date1 = new Date(2013, 12, 29),
          date2 = new Date(2013, 12, 30);

      expect(jadi.diff(date1, date2)).toEqual({ _left: date1, _right: date2 });
    });

    it('Boolean', function() {
      expect(jadi.diff(true, false)).toEqual({ _left: true, _right: false });
    });
  });

  it('should compare heterogeneous types as non equal', function() {
    expect(jadi.diff(1, true)).toEqual({ _left: 1, _right: true });
  });

});

describe('generic complex types', function() {

  it('should compare apples to oranges', function() {
    expect(jadi.diff([1], {a: 1})).toEqual({ _left: [1], _right: {a: 1}});
  });

});

describe('objects', function() {

  it('should consider empty objects equal', function() {
    expect(jadi.diff({}, {})).toBeUndefined();
  });

  it('should consider objects with same property and same value equal', function() {
    expect(jadi.diff({ a: 1 }, { a: 1 })).toBeUndefined();
  });

  it('should compare empty object against non-empty', function() {
    expect(jadi.diff({ a: 1 }, {})).toEqual({ a: { _left: 1 }});
    expect(jadi.diff({}, { a: 1 })).toEqual({ a: { _right: 1 }});
  });

  it('should compare objects with same property, same type and different value', function() {
    expect(jadi.diff({ a: 1}, { a: 2 })).toEqual({ a: { _left: 1, _right: 2 } });
  });

  it('should compare objects with same property and different type', function() {
    expect(jadi.diff({ a: 1 }, { a: 'hello' })).toEqual({ a: { _left: 1, _right: 'hello' } });
  });

  it('should compare objects with different properties', function() {
    expect(jadi.diff({ a: 1 }, { b: 2 })).toEqual({ a: { _left: 1 }, b: { _right: 2 } });
  });

});

describe('arrays', function() {

  it('should consider empty arrays equal', function() {
    expect(jadi.diff([], [])).toBeUndefined();
  });

  it('should consider arrays with same simple element equal', function() {
    expect(jadi.diff([1], [1])).toBeUndefined();
    expect(jadi.diff(['a'], ['a'])).toBeUndefined();
    expect(jadi.diff([true], [true])).toBeUndefined();
  });

  it('should consider arrays with same elements in order equal', function() {
    expect(jadi.diff([1,2], [1,2])).toBeUndefined();
  });

  // TODO: allow to override behavior for array ordering
  it('should consider arrays with same elements in different order equal', function() {
    expect(jadi.diff([1,2], [2,1])).toBeUndefined();
  });

  it('should compare empty array with non-empty array with simple elements', function() {
    expect(jadi.diff([], [1])).toEqual([{ _right: 1 }]);
    expect(jadi.diff([], ['a', true])).toEqual([{ _right: 'a' }, { _right: true }]);
  });

  it('should compare different arrays with simple values', function() {
    expect(jadi.diff([1,2], [2,3])).toEqual([{ _left: 1 }, { _right: 3 }]);
  });

  it('should compare arrays of equal objects given a key function', function() {
    expect(jadi.diff([{a: 1}], [{a: 1}], _.property('a'))).toBeUndefined();
    expect(jadi.diff([{a: 1, b: 1}], [{a: 1, b: 1}], _.property('a'))).toBeUndefined();
  });

  it('should compare array containing heterogeneous elements with different keys as function', function(){
    expect(jadi.diff([{ a: 1 }, 5], [5, { a: 1 }], function(item) { return item.a || item; })).toBeUndefined();
  });

  // TODO: maybe allow to omit a key and just compare object contents
  xit('should throw if comparing arrays of objects without a key', function() {
    expect(differ.bind(differ, [{a: 1}], [{a: 1}])).toThrow('Please provide a function to get the object key');
  });

  it('should compare arrays of different objects with key as function', function() {
    expect(jadi.diff([{a: 1, b: 2}], [{a: 1, b: 'c'}], _.property('a'))).toEqual([{ _key: 1, b: { _left: 2, _right: 'c' }}]);
  });

  it('should compare arrays of different objects with key as map', function() {
    expect(jadi.diff([{a: 1, b: 2}], [{a: 1, b: 'c'}], { _key: 'a' })).toEqual([{ _key: 1, b: { _left: 2, _right: 'c' }}]);
  });

  it('should compare arrays of different objects with nested object arrays and key as function', function() {
    var left =  [{a: 1, b: 2  , c: [{a: 2, b: 2  }]}],
        right = [{a: 1, b: 'c', c: [{a: 2, b: 'h'}]}];

    expect(jadi.diff(left, right, _.property('a'))).toEqual(
      [{
        _key: 1,
        b: {_left: 2, _right: 'c' },
        c: [{ _key: 2, b: {_left: 2, _right: 'h' } }]
      }]);
  });

  it('should compare arrays of different objects with nested object arrays with key as map', function() {
    var left =  [{a: 1, b: 2  , c: [{a: 2  , b: 2}]}],
        right = [{a: 1, b: 'c', c: [{a: 'h', b: 2}]}],
        keyMap = { _key: 'a', c: { _key: 'b' }};

    expect(jadi.diff(left, right, keyMap)).toEqual(
      [{
        _key: 1,
        b: {_left: 2, _right: 'c' },
        c: [{ _key: 2, a: {_left: 2, _right: 'h' } }]
      }]);
  });

  it('should compare arrays of different objects with nested object arrays with key as map with functions', function() {
    var left = [{a: 1, b: 2, c: [{a: 2, b: 2}]}],
        right = [{a: 1, b: 'c', c: [{a: 'h', b: 2}]}],
        keyMap = { _key: _.property('a'), c: { _key: _.property('b') }};

    expect(jadi.diff(left, right, keyMap)).toEqual(
      [{
        _key: 1,
        b: {_left: 2, _right: 'c' },
        c: [{ _key: 2, a: {_left: 2, _right: 'h' } }]
      }]);
  });

});