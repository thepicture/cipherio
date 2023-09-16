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

## Test

```bash
npm test
```
