"use strict";

const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const cipherio = require("..");

describe("compile", () => {
  it("should evaluate", () => {
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
});
