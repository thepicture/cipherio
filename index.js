"use strict";

const { EventEmitter } = require("node:events");

const huffman = require("./lib/huffman");
const { getNormalizedParams } = require("./lib/formatters");

class cipherio {
  static DEFAULT = 2 << 0;
  static HUFFMAN = 2 << 1;
  static HUFFMAN_COMPRESSED = 2 << 2;

  static #BIT_SHIFT_AMOUNT = 8;
  static #SEED_MODIFIER = 0xff;

  static Wrapper = class extends EventEmitter {
    #extends;

    constructor(extendTarget) {
      super();

      if (extendTarget) {
        Object.setPrototypeOf(this.__proto__, extendTarget.prototype);

        this.#extends = true;
      }

      return new Proxy(this, {
        map: new Map(),
        get(target, name) {
          const self = this;

          const isEventSubscription = name === "on" || target.#extends;

          const key = JSON.stringify({
            target: target.constructor.toString(),
            name,
          });

          if (typeof target[name] === "function") {
            if (this.map.has(key)) {
              return () => this.map.get(key);
            }

            return (...args) => {
              const output = target[name].bind(target)(...args);

              if (typeof output === "string") {
                const response = cipherio.compile(output);

                self.map.set(key, response);

                !isEventSubscription &&
                  target.emit("call", {
                    key,
                    before: output,
                    after: response,
                    didHash: true,
                  });

                return response;
              }

              !isEventSubscription &&
                target.emit("call", {
                  key,
                  before: output,
                  after: output,
                  didHash: false,
                });

              return output;
            };
          }

          const value = target[name];

          if (typeof value === "string") {
            const response = cipherio.compile(value);

            self.map.set(key, response);

            !isEventSubscription &&
              target.emit("access", {
                key,
                before: value,
                after: response,
                didHash: true,
              });

            return response;
          }

          !isEventSubscription &&
            target.emit("access", {
              key,
              before: value,
              after: value,
              didHash: false,
            });

          return value;
        },
      });
    }
  };

  static compile(code, params) {
    params = getNormalizedParams(params, this.DEFAULT);

    switch (params.encoding) {
      case this.HUFFMAN: {
        return huffman.encode(code, params.seed);
      }
      case this.HUFFMAN_COMPRESSED: {
        return huffman.encode(code, params.seed, { compressed: true });
      }
      case this.DEFAULT:
        return this.#shuffle(code, params, this.#disorder.bind(this));
      default:
        this.#throw();
    }
  }

  static read(code) {
    let compiledCode = code;
    let seed = 0;

    while (1) {
      const decodedCode = this.#decode(compiledCode, seed);

      const reEncodedCode = this.compile(decodedCode, seed);

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
      } catch {}

      seed++;
    }
  }

  static #decode(binary, params) {
    params = getNormalizedParams(params);

    if (params.encoding === this.HUFFMAN) {
      return huffman.decode(binary, params);
    }

    return this.#shuffle(binary, params, this.#restore.bind(this));
  }

  static #shuffle(text, { seed }, shuffleFunction) {
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
  }

  static #disorder({ code, index, seed }) {
    return (
      code ^
      ((code << this.#BIT_SHIFT_AMOUNT) |
        (seed & this.#SEED_MODIFIER) |
        (index & this.#SEED_MODIFIER))
    );
  }

  static #restore({ code, index, seed }) {
    return (code ^ seed ^ index) >> this.#BIT_SHIFT_AMOUNT;
  }

  static #throw(encoding) {
    throw new Error(`Encoding ${encoding} not supported`);
  }
}

module.exports = cipherio;
