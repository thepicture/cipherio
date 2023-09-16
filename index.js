"use strict";

const cipherio = {
  compile: (code, seed = 0) => {
    return cipherio.shuffle(code, seed, cipherio.avalanchize);
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

      seed++;
    }
  },
  decode: (binary, seed = 0) => {
    return cipherio.shuffle(binary, seed, cipherio.unavalanchize);
  },
  shuffle: (text, seed, shuffleFunction) => {
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
  avalanchize: ({ code, index, seed }) => {
    return code ^ ((code << 8) | (seed & 0xff) | (index & 0xff));
  },

  unavalanchize: ({ code, index, seed }) => {
    return (code ^ seed ^ index) >> 8;
  },
};

module.exports = cipherio;
