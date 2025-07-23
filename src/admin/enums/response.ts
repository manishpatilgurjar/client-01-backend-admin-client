/**
 * Standardized success response for admin APIs.
 * @template T - Type of the data payload
 */
export class AdminSuccessResponse<T = any> {
  success: true = true;
  message: string;
  data?: T;

  constructor(message: string, data?: T) {
    this.message = message;
    if (data !== undefined) {
      this.data = data;
    }
  }
}

/**
 * Standardized error response for admin APIs.
 */
export class AdminErrorResponse {
  success: false = false;
  message: string;
  error?: any;
  statusCode?: number;

  constructor(message: string, error?: any, statusCode?: number) {
    this.message = message;
    if (error !== undefined) {
      this.error = error;
    }
    if (statusCode !== undefined) {
      this.statusCode = statusCode;
    }
  }
} 