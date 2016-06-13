'use strict';

const CSS_STORE = new WeakMap();

exports.get = CSS_STORE.get.bind(CSS_STORE);
exports.set = CSS_STORE.set.bind(CSS_STORE);
exports.has = CSS_STORE.has.bind(CSS_STORE);
