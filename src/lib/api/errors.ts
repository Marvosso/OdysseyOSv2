/**
 * API Error Handling
 * 
 * Standardized error responses for API routes
 */

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Standard API error codes
 */
export enum ApiErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string = 'An error occurred'
): {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
} {
  if (error instanceof ApiError) {
    return {
      success: false,
      error: {
        code: error.code || ApiErrorCode.INTERNAL_ERROR,
        message: error.message,
        details: error.details,
      },
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        code: ApiErrorCode.INTERNAL_ERROR,
        message: error.message || defaultMessage,
      },
    };
  }

  return {
    success: false,
    error: {
      code: ApiErrorCode.INTERNAL_ERROR,
      message: defaultMessage,
    },
  };
}

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(
  error: unknown,
  res: { status: (code: number) => { json: (data: unknown) => void } }
): void {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json(createErrorResponse(error));
    return;
  }

  // Unknown error
  const errorResponse = createErrorResponse(error);
  res.status(500).json(errorResponse);
}

/**
 * Common error constructors
 */
export const ApiErrors = {
  badRequest: (message: string, details?: unknown) =>
    new ApiError(400, message, ApiErrorCode.BAD_REQUEST, details),
  
  unauthorized: (message: string = 'Unauthorized') =>
    new ApiError(401, message, ApiErrorCode.UNAUTHORIZED),
  
  forbidden: (message: string = 'Forbidden') =>
    new ApiError(403, message, ApiErrorCode.FORBIDDEN),
  
  notFound: (message: string = 'Resource not found') =>
    new ApiError(404, message, ApiErrorCode.NOT_FOUND),
  
  conflict: (message: string, details?: unknown) =>
    new ApiError(409, message, ApiErrorCode.CONFLICT, details),
  
  validationError: (message: string, details?: unknown) =>
    new ApiError(422, message, ApiErrorCode.VALIDATION_ERROR, details),
  
  rateLimitExceeded: (message: string = 'Rate limit exceeded') =>
    new ApiError(429, message, ApiErrorCode.RATE_LIMIT_EXCEEDED),
  
  internalError: (message: string = 'Internal server error') =>
    new ApiError(500, message, ApiErrorCode.INTERNAL_ERROR),
  
  serviceUnavailable: (message: string = 'Service unavailable') =>
    new ApiError(503, message, ApiErrorCode.SERVICE_UNAVAILABLE),
};
