define(function(require, exports, module) {
  const bar = require('./bar');
  module.exports = function () {
    return bar.baz();
  };
});
