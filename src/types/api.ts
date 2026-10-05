/**
 * Standard API response wrapper used by Northscore API
 */
export interface StandardResponse<T> {
  success: boolean;
  data: T | null;
  error_message?: string;
  request_id: string;
  timestamp: string; // ISO timestamp in America/Toronto
  message?: string;
}

/**
 * API Error structure returned by Northscore API
 */
export interface ApiError {
  error: {
    code: number; // HTTP status code
    message: string; // Human-readable error message
    timestamp: string; // ISO timestamp of when error occurred
    details: Record<string, unknown>; // Additional error details
  };
  type?: string; // Internal error type for easier handling
}

/**
 * Type guard to check if response is an API error
 */
export function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as ApiError).error === 'object' &&
    'code' in (response as ApiError).error &&
    'message' in (response as ApiError).error
  );
}
