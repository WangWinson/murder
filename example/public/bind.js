if (!Function.prototype.bind) {
  Function.prototype.bind = function (that) {
    var slice = Array.prototype.slice,
        args = slice.call(arguments, 1),
        func = this;
    return function () {
      return func.apply(
        that || this,
        args.concat(slice.call(arguments)));
    };
  };
}
