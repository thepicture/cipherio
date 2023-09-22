# cipherio

`Make secure parts in shared code`

## Install

`npm i --save cipherio`

## API

```js
const code = `a = 1;`;
let a = 0;

let seed = 1; // defaults to 0

const encoded = cipherio.compile(code, seed);
eval(cipherio.read(encoded));

console.log(a); // 1
```

Encoding types

```js
cipherio.DEFAULT; // disorders text in the idempotent way
cipherio.HUFFMAN; // disorders text using huffman algorithm
cipherio.HUFFMAN_COMPRESSED; // disorders text using huffman algorithm with smaller letter count of the resulting decoded text
```

```js
const code = `actual = 1;`;
const options1 = { encoding: cipherio.HUFFMAN, seed: 0 };
const options2 = { encoding: cipherio.HUFFMAN_COMPRESSED, seed: 1 };

const encoded1 = cipherio.compile(code, options1);
const encoded2 = cipherio.compile(code, options2);
const decoded1 = cipherio.read(encoded1);
const decoded2 = cipherio.read(encoded2);
```

`seed` defaults to 0

`encoding` defaults to `cipherio.DEFAULT`

Wrapping classes to return hashed values

```js
const instance = new (class extends cipherio.Wrapper {
  prop = "abc";
  foo() {
    return "bar";
  }
})();

const originalProp = cipherio.read(instance.prop);
const functionResult = cipherio.read(instance.foo());
```

Subscribe to events

```js
const instance = new (class extends cipherio.Wrapper {
  x = "abc";
  foo() {
    return true;
  }
})();

instance.on("access", ({ before, after }) => {
  console.log(before !== after); // true
});

instance.x;
```

```js
const instance = new (class extends cipherio.Wrapper {
  x = "abc";
  foo() {
    return true;
  }
})();

instance.on("call", ({ before, after }) => {
  // ...
});

instance.foo();
```

## Test

```bash
npm test
```
