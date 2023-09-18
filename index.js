"use strict";

const huffman = require("./lib/huffman");

const enums = {
  DEFAULT: 2 << 0,
  HUFFMAN: 2 << 1,
  HUFFMAN_COMPRESSED: 2 << 2,
};

const cipherio = {
  compile: (code, seed) => {
    if (isPrimitive(seed)) {
      seed = getOptions(seed);
    } else {
      seed.seed = seed.seed || 0;
    }

    cipherio.throwIfUnknownEncoding(seed.encoding);

    if (seed.encoding === cipherio.HUFFMAN) {
      return huffman.encode(code, seed.seed);
    }

    if (seed.encoding === cipherio.HUFFMAN_COMPRESSED) {
      return huffman.encode(code, seed.seed, { compressed: true });
    }

    return cipherio.shuffle(code, seed, cipherio.avalanche);
  },
  read: (code) => {
    let compiledCode = code;
    let seed = 0;

    while (1) {
      const decodedCode = cipherio.decode(compiledCode, seed);

      const reEncodedCode = cipherio.compile(decodedCode, seed);

      if (code === reEncodedCode) {
        return decodedCode;
      }

      try {
        const decoded = huffman.decode(code, seed);
        const encoded = huffman.encode(decoded, seed);

        if (encoded === code) {
          return decoded;
        }
      } catch {}

      try {
        const decoded = huffman.decode(code, seed, { compressed: true });
        const encoded = huffman.encode(decoded, seed, { compressed: true });

        if (encoded === code) {
          return decoded;
        }
      } catch (_) {
        console.log(_);
      }

      seed++;
    }
  },
  decode: (binary, seed) => {
    if (isPrimitive(seed)) {
      seed = getOptions(seed);
    } else {
      seed.seed = seed.seed || 0;
    }

    if (seed.encoding === cipherio.HUFFMAN) {
      return huffman.decode(binary, seed);
    }

    return cipherio.shuffle(binary, seed, cipherio.unavalanche);
  },
  shuffle: (text, { seed }, shuffleFunction) => {
    let shuffled = "";

    for (let i = 0; i < text.length; i++) {
      const charCode = shuffleFunction({
        seed,
        index:
          text
            .split("")
            .reduce((acc, character) => acc * character.charCodeAt(0), 1) %
          text.length,
        code: text.charCodeAt(i),
      });

      shuffled += String.fromCharCode(charCode);
    }

    return shuffled;
  },
  avalanche: ({ code, index, seed }) => {
    return code ^ ((code << 8) | (seed & 0xff) | (index & 0xff));
  },

  unavalanche: ({ code, index, seed }) => {
    return (code ^ seed ^ index) >> 8;
  },
  ...enums,
  throwIfUnknownEncoding: (encoding) => {
    if (!Object.values(enums).includes(encoding)) {
      throw new Error(`Encoding ${encoding} not supported`);
    }
  },
};

const isPrimitive = (seed) => typeof seed !== "object" && seed !== null;

const getOptions = (seed) => ({
  seed,
  encoding: cipherio.DEFAULT,
});

module.exports = cipherio;
