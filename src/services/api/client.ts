/* eslint-disable @typescript-eslint/no-base-to-string */
import { config } from '../../config/env.js';
import type { StandardResponse, ValidationErrorDetail } from '../../types/api.js';
import { isApiError } from '../../types/api.js';
import { API_TIMEOUT_MS } from '../../constants/index.js';

const BASE_URL = config.apiBaseUrl;

/**
 * Custom error class for Northscore API errors with improved error details
 */
export class NorthScoreApiClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public type: string,
    public details: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'NorthScoreApiClientError';
  }
}

/**
 * Validation error subclass with structured errors array
 */
export class ValidationError extends NorthScoreApiClientError {
  public validationErrors: ValidationErrorDetail[];

  constructor(message: string, statusCode: number, details: Record<string, unknown>) {
    super(message, statusCode, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';

    // Flatten validation errors for easier access
    this.validationErrors = this.extractValidationErrors(details);
  }

  private extractValidationErrors(details: Record<string, unknown>): ValidationErrorDetail[] {
    if (!details.errors || !Array.isArray(details.errors)) {
      return [];
    }

    return details.errors.map((err: unknown) => {
      if (typeof err === 'object' && err !== null) {
        const error = err as Record<string, unknown>;
        return {
          location: String(error.location || 'unknown'),
          message: String(error.message || 'Validation error'),
          type: String(error.type || 'unknown'),
        };
      }
      return {
        location: 'unknown',
        message: String(err),
        type: 'unknown',
      };
    });
  }
}

/**
 * Helper to create appropriate error instances
 */
function createApiError(
  statusCode: number,
  message: string,
  details: Record<string, unknown>,
  errorType: string,
): NorthScoreApiClientError {
  if (statusCode === 422 || errorType === 'VALIDATION_ERROR') {
    return new ValidationError(message, statusCode, details);
  }
  return new NorthScoreApiClientError(message, statusCode, errorType, details);
}

/**
 * Core API client for making HTTP requests
 * Handles errors, timeouts, and response parsing
 */
async function apiClient<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      try {
        const errorData: unknown = await response.json();

        // If backend sent error in expected format
        if (isApiError(errorData)) {
          const { message, details } = errorData.error;

          // Add helpful error types
          let errorType = 'API_ERROR';
          if (response.status === 403) errorType = 'API_KEY_EXPIRED';
          if (response.status === 404) errorType = 'NOT_FOUND';
          if (response.status === 422) errorType = 'VALIDATION_ERROR';
          if (response.status === 429) errorType = 'RATE_LIMIT';
          if (response.status >= 500) errorType = 'SERVER_ERROR';

          throw createApiError(response.status, message, details || {}, errorType);
        }

        // Fallback if error format is unexpected
        throw createApiError(
          response.status,
          'API request failed',
          { response: errorData },
          'API_ERROR',
        );
      } catch (parseError) {
        // If it's already our error, rethrow
        if (parseError instanceof NorthScoreApiClientError) {
          throw parseError;
        }

        // Handle JSON parse error
        if (parseError instanceof SyntaxError) {
          throw createApiError(
            response.status,
            'Failed to parse error response',
            {},
            'PARSE_ERROR',
          );
        }

        // Fallback
        throw createApiError(
          response.status,
          response.statusText || `HTTP error ${response.status}`,
          {},
          'API_ERROR',
        );
      }
    }

    const data: unknown = await response.json();
    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);

    // Rethrow if already our custom error
    if (error instanceof NorthScoreApiClientError) {
      throw error;
    }

    // Handle timeout
    if ((error as Error).name === 'AbortError') {
      throw createApiError(408, 'Request timeout', {}, 'TIMEOUT');
    }

    // Handle network errors
    throw createApiError(0, `Network error: ${(error as Error).message}`, {}, 'NETWORK_ERROR');
  }
}

/**
 * Fetch data from Northscore API
 * Handles StandardResponse wrapper and unwraps data
 */
export async function fetchData<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean>,
): Promise<T> {
  // Build query string
  const entries: [string, string][] = params
    ? Object.entries(params).map(([k, v]) => [k, String(v)])
    : [];
  const qs = entries.length > 0 ? `?${new URLSearchParams(entries).toString()}` : '';

  const url = `${BASE_URL}${endpoint}${qs}`;

  // Make the API request
  const wrapped = await apiClient<StandardResponse<T>>(url, {
    method: 'GET',
    headers: {
      'X-API-KEY': config.northScoreApiKey,
      'Content-Type': 'application/json',
    },
  });

  // Unwrap StandardResponse
  if (!wrapped.success || !wrapped.data) {
    throw createApiError(
      500,
      wrapped.error_message || 'API request failed',
      { response: wrapped },
      'API_ERROR',
    );
  }

  return wrapped.data;
}
