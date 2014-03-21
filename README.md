ja.di [![Build Status](https://travis-ci.org/simoneb/ja.di.svg?branch=master)](https://travis-ci.org/simoneb/ja.di)
====

**ja.di** is a javascript diff library, it can compute the differences between two javascript values.

## Install

```bash
npm install ja.di
``` 

or download [ja.di.js](ja.di.js) and include it in a Web page.

```html
<!-- 
<script src="lodash.js"></script>
-->
<script src="ja.di.js"></script>
```

> **ja.di** depends on [lodash](http://lodash.com/), it should be available either as node module or in the global scope of a Web page.

## Reference

In a standard Web page the `window` object gets a `jadi` property which can be used globally.

In a standard node app:
 
```javascript
var jadi = require('ja.di');
```
 
In a [RequireJS](http://requirejs.org/) module:
 
```javascript
define(['ja.di'], function(jadi) { 
   [...] 
});
```

## Use

The `jadi` object contains two functions:

- `diff(left, right, [key])` returns the difference between `left` and `right`, optionally with a `key` object, mandatory when diffing arrays of complex objects
- `interpret(diff, map)` interprets the results returned by `jadi.diff` and invokes uses `map` to handle the differences

### diff

`diff`-ing two objects returns `undefined` if they have the same value:

```javascript
jadi.diff(1, 1);
 > undefined
```

Otherwise an *object* is returned, which matches the structure of the input values. 

For **simple values** the result contains the values themselves in its `_left` and `_right` properties:

```javascript
jadi.diff(1, 2);
 > { _left: 1, _right: 2 }
```

It works with any simple types:

```javascript
jadi.diff("hello", "world")
 > { _left: "hello", _right: "world" }
```

> As of now there is no special support for smart string diffing, i.e. similarity checks.

**Arrays** are compared element by element, without taking element position into account:

```javascript
jadi.diff([1,2], [2,1]);
 > undefined
```

If the elements differ the result is an array of objects representing the unmatched elements:

```javascript
jadi.diff(['a','b'], ['b','c']);
 > [{ _left: 'a' }, { _right: 'c' }]
```

If the elements of the array are complex values a `key` function is required to match object with the same key together, and the result will have an additional `_key` property to identify them:

```javascript
var left  = [{a: 1, b: 'hello'}],
    right = [{a: 1, b: 'world'}];
jadi.diff(left, right, function(el) { return el.a; });
 > [{ _key: 1, b: { _left: 'hello', _right: 'world' }}]
```

A key can also be an object instead of a function, in this case it identifies the name of the property to be treated as key:

```javascript
var left  = [{a: 1, b: 'hello'}],
    right = [{a: 1, b: 'world'}];
jadi.diff(left, right, { _key: 'a' });
 > [{ _key: 1, b: { _left: 'hello', _right: 'world' }}] // same as before
```

**Objects** are compared based on their properties' values, the result is an object:

```javascript
jadi.diff({ a: 1 }, { a: 2 });
 > { a: { _left: 1, _right: 2 } }
```

Comparing objects with different properties (rather than different property values) will result in an object with multiple properties:

```javascript
jadi.diff({ a: 1 }, { b: 2 });
 > { a: { _left: 1 }, b: { _right: 2 } }
```

> For more details refer to the [diff spec](spec/diff.spec.js)

### interpret

Interpreting a diff can be non-trivial, therefore an `interpret` function is supplied which provides a higher level API. It takes a *diff* and a *map*, which is invoked whenever a corresponding mismatch is found. The following examples assume that there is a `dump` function which writes to the console.

```javascript
var diff = jadi.diff(1, 2); // { _left: 1, _right: 2 }
jadi.interpret(diff, { _left: dump });
 > 1
```

A map is an *object* that mimics the structure of a diff and contains callbacks which are invoked with the values contained therein.

```javascript
jadi.interpret(jadi.diff(1, 2), { _left: dump, _right: dump });
 > 1
 > 2
```

Although diffs come with `_left` and `_right` properties there's a shorthand syntax to handle both at the same time, in case you don't care which side the diff comes from:

```javascript
jadi.interpret(jadi.diff(1, 2), dump);
 > 1
 > 2
```

**Array** diffs are handled similarly, note that in case a callback function is not supplied for a specific part of a diff (i.e. you're not interested in that part) nothing bad happens:

```javascript
var diff = jadi.diff([1,2,3], [3,4]); // [{ _left: 1 }, { _left: 2 }, { _right: 4 }]
jadi.interpret(diff, { _left: dump });
 > 1
 > 2
```

```javascript
var diff = jadi.diff([1,2,3], [3,4]);
jadi.interpret(diff, { _right: dump });
 > 4
```

With arrays of complex values it gets a little bit trickier, what is the difference between `[{ a: 'the key', b: 2 }]` and `[{ a: 'the key', b: 3 }]`? We need a key to decide which elements should be compared to each other, in this case we choose property `a` as the key:

```javascript
var the_diff = jadi.diff([{ a: 'the_key', b: 2 }], [{ a: 'the_key', b: 3 }], { _key: 'a' });
 > the_diff = [{ b: { _left: 2, _right: 3 }, _key: 'the_key' }]
```

To interpret such a diff with a `_key` we need a map with a key too. The callbacks in the map will receive one additional first argument, they key of the compared objects:

```javascript
var map = { _key: { b: { _left: dump, _right: dump } } };
jadi.interpret(the_diff, map);
 > the_key 2 // left callback
 > the_key 3 // right callback
```

The shorthand syntax still works:

```javascript
var map = { _key: { b: dump } };
jadi.interpret(the_diff, map);
 > the key 2 3
```

**Object** diffs offer an additional dotted notation to invoke composite callbacks when multiple properties change. All the values of the changed properties are passed to the callback:

```javascript
var map = { 'a.b': dump };
jadi.interpret(jadi.diff({ a: 1, b: 2 }, { a: 2, b: 3} ), map);
 >        1 2 2 3
// a left ^ ^ ^ ^ b right
//  b left -^ ^- a right
```

Composite handlers can create a hierarchy whereby if multiple properties change the most specific composite handler is called first, and in turn less specific handlers, in any, down to the single property handler.
This is achieved by returning a value from composite callbacks. If the return value has a truthy value the property change is considered handled and less specific (or single property) callbacks are not invoked.
The default return value of functions, `undefined`, is a falsy value therefore all callbacks, from more specific to less specific, are always called.

> For more details refer to the [interpret spec](spec/interpret.spec.js)
