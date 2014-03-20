(function(){
  var makeInterpret = function(_) {
    function handleCompositeProperties(diff, map, keys) {
      var handledProperties = [];

      _(map).keys()
        .map(function(k) { return k.split('.'); })
        .filter(function(arr) { return arr.length > 1 })
        .filter(function(arr) { return _.every(arr, _.bind(_.has, _, diff)); })
        .sortBy(function(arr) { return -arr.length; })
        .forEach(function(arr) {
          if(_.intersection(arr, handledProperties).length) return;

          var key = arr.join('.');

          // assuming that all keys values in diff will have a _left and _right
          if(_.isFunction(map[key])) {
            if(map[key].apply(undefined, keys.concat(_.flatten(_.map(_.pick(diff, arr), function(p) { return [p._left, p._right]; }))))) {
              Array.prototype.push.apply(handledProperties, arr);
            }
          }
        });

      return handledProperties;
    }

    function mapArrayDiff(diffs, map, keys) {
      _.forEach(diffs, function (diff) {
        // shorthand syntax for left-right
        if ((_.has(diff, '_left') || _.has(diff, '_right')) && _.isFunction(map)) {
          map.apply(undefined, keys.concat([diff['_left'], diff['_right']]));
        }

        // common syntax for handling either left or right individually
        _.forEach(['_left', '_right'], function (key) {
          if (_.has(map, key) && _.has(diff, key)) {
            map[key].apply(undefined, keys.concat(diff[key]));
          }
        });

        // recur on keys
        if (_.has(map, '_key') && _.has(diff, '_key')) {
          mapDiff(_.omit(diff, '_key'), map['_key'], (keys.concat(diff['_key'])));
        }

        // recur on object properties
        _.forOwn(_.omit(diff, ['_key', '_left', '_right'].concat(handleCompositeProperties(diff, map, keys))), function (value, key) {
          if (_.has(map, key) && _.has(diff, key)) {
            mapDiff(diff[key], map[key], keys);
          }
        });
      });
    }

    function mapDiff(diffs, map, keys) {
      if (!_.isArray(diffs)) {
        mapArrayDiff([diffs], map, keys);
      } else {
        mapArrayDiff(diffs, map, keys);
      }
    }

    return function (diffs, map) {
      if (!diffs) return;

      mapDiff(diffs, map, []);
    };
  };
  var makeDiff = function(_) {
    function makeKeyGetter(keyValue) {
      if(_.isPlainObject(keyValue) && _.has(keyValue, '_key')) {
        var keyAsMap = keyValue['_key'];

        if(_.isFunction(keyAsMap)) {
          return keyAsMap;
        } else if(_.isString(keyAsMap)) {
          return _.property(keyAsMap);
        } else {
          throw '_key should either be a String or a Function';
        }
      }

      return keyValue || _.identity;
    }

    function createKeyToIndex(arr, keyValue) {
      var result = {},
        getKey = makeKeyGetter(keyValue);

      _.forEach(arr, function (item, index) {
        result[getKey(item)] = index;
      });

      return result;
    }

    function diffArrays(left, right, keyValue) {
      var result = [],
        leftKeyToIndex = createKeyToIndex(left, keyValue),
        rightKeyToIndex = createKeyToIndex(right, keyValue);

      _.forEach(left, function (d) {
        var key = makeKeyGetter(keyValue)(d);

        if (rightKeyToIndex.hasOwnProperty(key)) {
          var differences = diff(d, right[rightKeyToIndex[key]], keyValue);

          if(differences)
            result.push(_.assign(differences, { _key: key }));
        } else {
          result.push({ _left: d });
        }
      });

      _.forEach(right, function (d) {
        var key = makeKeyGetter(keyValue)(d);

        if (leftKeyToIndex.hasOwnProperty(key) === false) {
          result.push({ _right: d });
        }
      });

      return result.length ? result : undefined;
    }

    function diffObjects(left, right, keyValue) {
      var result = {};

      _.forOwn(left, function(value, key) {
        if(_.isPlainObject(keyValue) && _.has(keyValue, key)) {
          keyValue = keyValue[key];
        }

        if(_.has(right, key)) {
          var differences = diff(value, right[key], keyValue);

          if(differences) {
            result[key] = differences;
          }
        } else {
          result[key] = { _left: value };
        }
      });

      _.forOwn(right, function(value, key) {
        if(_.has(left, key) === false) {
          result[key] = { _right: value };
        }
      });

      return _.isEmpty(result) ? undefined : result;
    }

    var diff = function (left, right, keyValue) {
      if (_.isArray(right) && _.isArray(left)) {
        return diffArrays(left, right, keyValue);
      }

      if(_.isPlainObject(right) && _.isPlainObject(left)) {
        return diffObjects(left, right, keyValue);
      }

      if(_.isDate(left) && _.isDate(right) && left.getTime() === right.getTime()
        || left === right) {
        return undefined;
      }

      return { _left: left, _right: right };
    };

    return diff;
  };

  if(typeof window == "undefined") {
    if(typeof exports == "object") {
      exports.interpret = makeInterpret(require('lodash'));
      exports.diff = makeDiff(require('lodash'));
    }

    if(typeof define == "function") {
      define(['lodash'], function(_){
        return {
          interpret: makeInterpret(_),
          diff: makeDiff(_)
        };
      });
    }
  } else {
    window.jadi = {
      interpret: makeInterpret(window._),
      diff: makeDiff(window._)
    };
  }
})();