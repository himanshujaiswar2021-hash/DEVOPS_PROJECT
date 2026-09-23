/**
 * Standardized API Response & Error Code Helper
 * Used across all microservices for consistent formatting.
 */

function sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}

function sendError(res, message = 'Internal Server Error', statusCode = 500, errorDetails = null) {
  const errorMap = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  };

  return res.status(statusCode).json({
    success: false,
    statusCode,
    error: errorMap[statusCode] || 'Error',
    message,
    details: errorDetails,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  sendSuccess,
  sendError
};
