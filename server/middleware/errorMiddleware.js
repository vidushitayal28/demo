export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  console.error(error);
  if (res.headersSent) return next(error);

  const status = error.status || (error.name === "ValidationError" ? 400 : 500);
  res.status(status).json({
    message: status === 500 ? "Something went wrong on the server." : error.message
  });
}
