"use strict";

const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const cipherio = require("..");

describe("compile", () => {
  it("should compile and then read", () => {
    const expected = 1;
    const code = `actual = 1;`;
    let actual = 0;

    const encoded = cipherio.compile(code);
    const original = cipherio.read(encoded);

    eval(original);

    assert.strictEqual(actual, expected);
  });

  it("should not be original code", () => {
    const expected = false;
    const code = `actual = 1;`;

    const actual = cipherio.compile(code) === code;

    assert.strictEqual(actual, expected);
  });

  it("should have idempotence", () => {
    const code = `actual = 1;`;

    const actual1 = cipherio.compile(code);
    const actual2 = cipherio.compile(code);

    assert.strictEqual(actual1, actual2);
  });

  it("should make seed to influence", () => {
    const code = `actual = 1;`;

    const actual1 = cipherio.compile(code, 1);
    const actual2 = cipherio.compile(code, 2);

    assert.notStrictEqual(actual1, actual2);
  });

  it("should have avalanche effect without seed", () => {
    const code1 = `actual = 1;`;
    const code2 = `actual =1;`;

    const actual1 = cipherio.compile(code1);
    const actual2 = cipherio.compile(code2);

    for (let i = 0; i < Math.min(actual1.length, actual2.length) - 1; i++) {
      const sliced1 = actual1.slice(0, -i - 1);
      const sliced2 = actual2.slice(0, -i - 1);

      assert.ok(actual1[i] !== actual2[i]);
      assert.ok(!sliced1.includes(actual2));
      assert.ok(!sliced2.includes(actual1));
      assert.ok(!actual1.includes(sliced2));
      assert.ok(!actual2.includes(sliced1));
      assert.ok(!sliced1.includes(sliced2));
      assert.ok(!sliced2.includes(sliced1));
    }
  });

  it("should have avalanche effect with seed", () => {
    const code1 = `actual = 1;`;
    const code2 = `actual = 1;`;

    const actual1 = cipherio.compile(code1, 1);
    const actual2 = cipherio.compile(code2, 2);

    for (let i = 0; i < Math.min(actual1.length, actual2.length) - 1; i++) {
      const sliced1 = actual1.slice(0, -i - 1);
      const sliced2 = actual2.slice(0, -i - 1);

      assert.ok(actual1[i] !== actual2[i]);
      assert.ok(!sliced1.includes(actual2));
      assert.ok(!sliced2.includes(actual1));
      assert.ok(!actual1.includes(sliced2));
      assert.ok(!actual2.includes(sliced1));
      assert.ok(!sliced1.includes(sliced2));
      assert.ok(!sliced2.includes(sliced1));
    }
  });

  it("should evaluate with default mode provided", () => {
    const expected = 1;
    const code = `actual = 1;`;
    let actual = 0;

    const encoded = cipherio.compile(code, { encoding: cipherio.DEFAULT });
    const original = cipherio.read(encoded);
    eval(original);

    assert.strictEqual(actual, expected);
  });

  it("should evaluate with huffman mode provided", () => {
    const expected = 1;
    const code = `actual = 1;`;
    let actual = 0;

    const defaultEncoded = cipherio.compile(code, {
      encoding: cipherio.DEFAULT,
    });
    const huffmanEncoded = cipherio.compile(code, {
      encoding: cipherio.HUFFMAN,
    });
    const original = cipherio.read(huffmanEncoded);
    eval(original);

    assert.notStrictEqual(defaultEncoded, huffmanEncoded);
    assert.strictEqual(actual, expected);
  });

  it("should have huffman encoding idempotence", () => {
    const code = `actual = 1;`;
    const options = { encoding: cipherio.HUFFMAN };

    const actual1 = cipherio.compile(code, options);
    const actual2 = cipherio.compile(code, options);
    const defaultEncoded = cipherio.compile(code);

    assert.notStrictEqual(actual1, defaultEncoded);
    assert.notStrictEqual(actual2, defaultEncoded);
    assert.strictEqual(actual1, actual2);
  });

  it("should support huffman seed", () => {
    const code = `actual = 1;`;
    const options1 = { encoding: cipherio.HUFFMAN, seed: 1 };
    const options2 = { encoding: cipherio.HUFFMAN, seed: 2 };

    const actual1 = cipherio.compile(code, options1);
    const actual2 = cipherio.compile(code, options2);
    const decoded1 = cipherio.read(actual1);
    const decoded2 = cipherio.read(actual2);

    assert.strictEqual(decoded1, code);
    assert.strictEqual(decoded2, code);
    assert.notStrictEqual(actual1, actual2);
  });

  it("should support huffman without double quotes", () => {
    const code = `actual = 1;`;
    const options1 = { encoding: cipherio.HUFFMAN_COMPRESSED, seed: 0 };
    const options2 = { encoding: cipherio.HUFFMAN_COMPRESSED, seed: 1 };

    const actual1 = cipherio.compile(code, options1);
    const actual2 = cipherio.compile(code, options2);
    const decoded1 = cipherio.read(actual1);
    const decoded2 = cipherio.read(actual2);

    assert.ok(!actual1.includes('"'));
    assert.strictEqual(decoded1, code);
    assert.strictEqual(decoded2, code);
    assert.notStrictEqual(actual1, actual2);
  });

  it("should throw on unknown encoding", () => {
    const code = `actual = 1;`;
    const options = { encoding: -1, seed: 1 };

    const actual = () => cipherio.compile(code, options);

    assert.throws(actual);
  });

  it("should not expose private methods", () => {
    assert.ok(typeof cipherio.decode === "undefined");
    assert.ok(typeof cipherio.shuffle === "undefined");
    assert.ok(typeof cipherio.avalanche === "undefined");
    assert.ok(typeof cipherio.unavalanche === "undefined");
    assert.ok(typeof cipherio.throwIfUnknownEncoding === "undefined");
  });

  it("should allow to hash class", () => {
    const instance = new (class extends cipherio.Wrapper {})();

    assert.ok(instance instanceof cipherio.Wrapper);
  });

  it("should allow to hash class", () => {
    const instance = new (class extends cipherio.Wrapper {
      ok() {
        return true;
      }
    })();

    const actual = () => instance.ok();

    assert.doesNotThrow(actual);
  });

  it("should return hashed values for functions that return strings", () => {
    const expected = "01";
    const instance = new (class extends cipherio.Wrapper {
      ok() {
        return "01";
      }
    })();

    const actual = cipherio.read(instance.ok());

    assert.strictEqual(actual, expected);
  });

  it("should return original values for functions that return not strings", () => {
    const expected = true;
    const instance = new (class extends cipherio.Wrapper {
      ok() {
        return true;
      }
    })();

    const actual = instance.ok();

    assert.ok(typeof actual !== "string");
    assert.strictEqual(actual, expected);
  });

  it("should cache calls", () => {
    const expected = "abc";
    const instance = new (class extends cipherio.Wrapper {
      ok() {
        return "abc";
      }
    })();

    instance.ok();
    instance.ok();
    instance.ok();
    instance.ok();
    instance.ok();
    instance.ok();
    const actual = cipherio.read(instance.ok());

    assert.strictEqual(actual, expected);
  });

  it("should hash properties", () => {
    const expected = "abc";
    const instance = new (class extends cipherio.Wrapper {
      prop = "abc";
    })();

    const actual = cipherio.read(instance.prop);

    assert.strictEqual(actual, expected);
  });

  it("should work with props and functions simultaneously", () => {
    const expected1 = "abc";
    const expected2 = "bar";
    const instance = new (class extends cipherio.Wrapper {
      prop = "abc";
      foo() {
        return "bar";
      }
    })();

    const actual1 = cipherio.read(instance.prop);
    const actual2 = cipherio.read(instance.foo());

    assert.strictEqual(actual1, expected1);
    assert.strictEqual(actual2, expected2);
  });

  it("should work with many props as numbers passed into function not hashed", () => {
    const expected = 6;
    const instance = new (class extends cipherio.Wrapper {
      foo(a, b, c) {
        return a + b + c;
      }
    })();

    const actual = instance.foo(1, 2, 3);

    assert.strictEqual(actual, expected);
  });

  it("should work with many props as strings passed into function hashed", () => {
    const expected = "123";
    const instance = new (class extends cipherio.Wrapper {
      foo(a, b, c) {
        return a + b + c;
      }
    })();

    const actual = cipherio.read(instance.foo("1", "2", "3"));

    assert.strictEqual(actual, expected);
  });

  it("should allow to set string property that becomes hashed", () => {
    const expected = "123";
    const instance = new (class extends cipherio.Wrapper {})();

    instance.prop = "123";

    const actual = cipherio.read(instance.prop);

    assert.strictEqual(actual, expected);
  });

  it("should allow to set number property that will not become hashed", () => {
    const expected = 123;
    const instance = new (class extends cipherio.Wrapper {})();

    instance.prop = 123;

    const actual = instance.prop;

    assert.strictEqual(actual, expected);
  });

  it("should work with objects that will not be hashed", () => {
    const expected = {
      a: 1,
      b: 2,
      c: 3,
    };
    const instance = new (class extends cipherio.Wrapper {
      foo(a, b, c) {
        return {
          ...a,
          ...b,
          ...c,
        };
      }
    })();

    const actual = instance.foo({ a: 1 }, { b: 2 }, { c: 3 });

    assert.deepStrictEqual(actual, expected);
  });

  it("should work with special values", () => {
    const expected = [null, undefined, NaN, Infinity];
    const instance = new (class extends cipherio.Wrapper {
      foo(...args) {
        return args;
      }
    })();

    const actual = instance.foo(null, undefined, NaN, Infinity);

    assert.deepStrictEqual(actual, expected);
  });
});
