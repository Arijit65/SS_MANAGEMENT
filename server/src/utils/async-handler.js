const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error(`❌ Async Error in ${req.method} ${req.path}:`, err.message);
    next(err);
  });
};

module.exports = asyncHandler;
