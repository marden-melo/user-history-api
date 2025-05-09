import { HttpException } from '@nestjs/common';

export function formatError(error: unknown): {
  statusCode: number;
  message: string;
  error: string;
} {
  if (error instanceof HttpException) {
    const response = error.getResponse();
    return typeof response === 'string'
      ? { statusCode: error.getStatus(), message: response, error: error.name }
      : (response as { statusCode: number; message: string; error: string });
  }
  return {
    statusCode: 500,
    message: 'Internal server error',
    error: 'Internal Server Error',
  };
}
