var jadi = jadi || require('../ja.di'),
    _ = _ || require('lodash');

var diff = _.wrap(jadi.diff, function(diff) {
  var result = diff.apply(undefined, Array.prototype.slice.call(arguments).slice(1));
  console.log(result);
  return result;
});

describe('something', function() {

  it('should do nothing with undefined diff', function() {
    jadi.interpret(undefined);
  });

  it('should do nothing if map is undefined', function() {
    jadi.interpret({_left: 1});
    jadi.interpret([{_right: 1}]);
    jadi.interpret([{ _key: 1, b: {_left: 2, _right: 'c' }}]);
  });

  it('should invoke map function for simple case', function() {
    var map = { _left: jasmine.createSpy('_left'), _right: jasmine.createSpy('_right') };

    jadi.interpret(diff(1, 2), map);

    expect(map._left).toHaveBeenCalledWith(1);
    expect(map._right).toHaveBeenCalledWith(2);
  });

  it('should not complain if handler for a diff is not defined and call only left', function() {
    var map = jasmine.createSpyObj('map', ['_left']);

    jadi.interpret(diff(1, 2), map);

    expect(map._left).toHaveBeenCalledWith(1);
  });

  it('should not complain if handler for a diff is not defined and call only right', function() {
    var map = jasmine.createSpyObj('map', ['_right']);

    jadi.interpret(diff(1, 2), map);

    expect(map._right).toHaveBeenCalledWith(2);
  });

  it('should support shorthand syntax for left-right change', function() {
    var map = jasmine.createSpy('root');

    jadi.interpret(diff(1, 2), map);

    expect(map).toHaveBeenCalledWith(1, 2);
  });

  it('should support arrays', function() {
    var map = { _left: jasmine.createSpy('_left'), _right: jasmine.createSpy('_right') };

    jadi.interpret(diff([1,2,3], [3,4,5]), map);

    expect(map._left).toHaveBeenCalledWith(1);
    expect(map._left).toHaveBeenCalledWith(2);
    expect(map._left).not.toHaveBeenCalledWith(3);
    expect(map._right).not.toHaveBeenCalledWith(3);
    expect(map._right).toHaveBeenCalledWith(4);
    expect(map._right).toHaveBeenCalledWith(5);
  });

  it('should support (weird) shorthand syntax for arrays', function () {
    var map = jasmine.createSpy('root');

    jadi.interpret(diff([1,2],[2,3]), map);

    expect(map).toHaveBeenCalledWith(1, undefined);
    expect(map).toHaveBeenCalledWith(undefined, 3);
  });

  describe('with keys', function(){

    it('should invoke shorthand callback with key', function() {
      var map = { _key: { b: jasmine.createSpy('root') } };

      jadi.interpret(diff([{a: 1, b: 2}], [{a: 1, b: 3}], _.property('a')), map);

      expect(map._key.b).toHaveBeenCalledWith(1, 2, 3);
    });

    it('should invoke handler with key', function() {
      var map = { _key: { b: { _left: jasmine.createSpy('left'), _right: jasmine.createSpy('right') } } };

      jadi.interpret(diff([{a: 'the_key', b: 2}], [{a: 'the_key', b: 3}], _.property('a')), map);

      expect(map._key.b._left).toHaveBeenCalledWith('the_key', 2);
      expect(map._key.b._right).toHaveBeenCalledWith('the_key', 3);
    });

  });

  describe('multiple object properties', function() {

    it('should support handlers for multiple property changes', function() {
      var map = { 'a.b': jasmine.createSpy('a.b') };

      jadi.interpret(diff({a: 1, b: 2}, {a: 2, b: 3}), map);

      expect(map['a.b']).toHaveBeenCalledWith(1, 2, 2, 3);
    });

    it('should call only most specific handler when only one composite and one simple and composite returns truthy', function() {
      var map = { 'a.b': jasmine.createSpy('a.b').andReturn(true), a: jasmine.createSpy('a') };

      jadi.interpret(diff({a: 1, b: 2}, {a: 2, b: 3}), map);

      expect(map['a.b']).toHaveBeenCalledWith(1, 2, 2, 3);
      expect(map['a']).not.toHaveBeenCalled();
    });

    it('should call the less specific handler when only one composite and one simple and composite returns falsy', function() {
      var map = { 'a.b': jasmine.createSpy('a.b').andReturn(false), a: jasmine.createSpy('a') };

      jadi.interpret(diff({a: 1, b: 2}, {a: 2, b: 3}), map);

      expect(map['a.b']).toHaveBeenCalledWith(1, 2, 2, 3);
      expect(map['a']).toHaveBeenCalledWith(1, 2);
    });

    it('should call only most specific handler when two composite and the most specific returns truthy', function() {
      var map = { 'a.b.c': jasmine.createSpy('a.b.c').andReturn(true), 'a.b': jasmine.createSpy('a.b') };

      jadi.interpret(diff({a: 1, b: 2, c: 3}, {a: 2, b: 3, c: 4}), map);

      expect(map['a.b.c']).toHaveBeenCalledWith(1, 2, 2, 3, 3, 4);
      expect(map['a.b']).not.toHaveBeenCalled();
    });

    it('should call less specific handler when two composite and the most specific returns falsy', function() {
      var map = { 'a.b.c': jasmine.createSpy('a.b.c').andReturn(false), 'a.b': jasmine.createSpy('a.b') };

      jadi.interpret(diff({a: 1, b: 2, c: 3}, {a: 2, b: 3, c: 4}), map);

      expect(map['a.b.c']).toHaveBeenCalledWith(1, 2, 2, 3, 3, 4);
      expect(map['a.b']).toHaveBeenCalledWith(1, 2, 2, 3);
    });

    it('should work with objects in arrays too', function() {
      var map = { _key: { 'a.b': jasmine.createSpy('a.b') } };

      jadi.interpret(diff([{a: 1, b: 2, k: 'a'}], [{a: 2, b: 3, k: 'a'}], _.property('k')), map);

      expect(map._key['a.b']).toHaveBeenCalledWith('a', 1, 2, 2, 3);
    });

  });

});