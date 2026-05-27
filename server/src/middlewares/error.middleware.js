const notFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

const errorHandler = (err, _req, res, _next) => {
  const status = err.status || 500;
  
  // Log error to console with full details
  console.error('─────────────────────────────────────────');
  console.error(`❌ ERROR [${new Date().toISOString()}]`);
  console.error(`Status: ${status}`);
  console.error(`Message: ${err.message}`);
  if (err.stack) {
    console.error('Stack trace:');
    console.error(err.stack);
  }
  if (err.errors) {
    console.error('Validation errors:', JSON.stringify(err.errors, null, 2));
  }
  if (err.original) {
    console.error('Original error:', err.original.message || err.original);
  }
  console.error('─────────────────────────────────────────');

  return res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
