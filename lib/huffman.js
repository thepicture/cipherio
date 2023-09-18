"use strict";

// https://github.com/kelreel/huffman-javascript
const encode = (text, codes) => {
  const result = [];
  for (const char of text) {
    result.push(codes.get(char));
  }
  return result;
};

const decode = (encodedText, codes) => {
  let result = "";
  const reversedCodes = {};
  Array.from(codes.entries()).forEach(([key, value]) => {
    reversedCodes[value] = key;
  });
  for (const code of encodedText) {
    result += reversedCodes[code];
  }
  return result;
};

const getCharCodesFromSource = (text) => {
  const freqArr = getCharsFrequency(text);
  const tree = getTree(freqArr);
  const codes = new Map(); // Array with symbols and codes
  getCodes(tree, (char, code) => {
    codes.set(char, code);
  });
  return codes;
};

const getCodes = (tree, callback, code = "") => {
  if (!tree) {
    return;
  }
  if (!tree.left && !tree.right) {
    callback(tree.char, code);
    return;
  }
  getCodes(tree.left, callback, code + "0");
  getCodes(tree.right, callback, code + "1");
};

const getCharsFrequency = (text) => {
  const freq = new Map();
  for (const char of text) {
    const count = freq.get(char);
    freq.set(char, count ? count + 1 : 1);
  }
  return Array.from(freq).sort((a, b) => b[1] - a[1]); // descending
};

const getTree = (frequency) => {
  const nodes = [];
  for (const [char, weight] of frequency) {
    nodes.push({ char, weight, left: null, right: null });
  }
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.weight - b.weight);
    const left = nodes.shift();
    const right = nodes.shift();
    const parent = {
      char: "",
      weight: left?.weight + right?.weight,
      left,
      right,
    };
    nodes.push(parent);
  }
  return nodes[0];
};

const getCharCodeShiftedText = (text, amount) =>
  [...text]
    .map((character) => String.fromCharCode(character.charCodeAt(0) + amount))
    .join("");

module.exports = {
  encode: (text, seed) => {
    let codes = getCharCodesFromSource(text);

    return getCharCodeShiftedText(
      `${encode(text, codes)}${JSON.stringify(
        Object.fromEntries(codes.entries())
      )}`,
      seed
    );
  },
  decode: (encoded, seed) => {
    const [, binary, codes] = /([\d,]+)({.+})/.exec(
      getCharCodeShiftedText(encoded, -seed)
    );

    const codeMap = new Map(Object.entries(JSON.parse(codes)));

    return decode(binary.split(","), codeMap);
  },
};
