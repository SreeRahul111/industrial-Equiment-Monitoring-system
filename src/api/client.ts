const BASE_URL = '/api/v1';

export class ApiError extends Error {
  status: number;
  validationErrors?: string[];

  constructor(message: string, status: number, validationErrors?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.validationErrors = validationErrors;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const getSafeToken = () => {
    try {
      return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('iems_auth_token') : null;
    } catch {
      return null;
    }
  };

  const token = getSafeToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Clear token if expired or unauthorized
      if (!endpoint.includes('/auth/login')) {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem('iems_auth_token');
            window.localStorage.removeItem('iems_current_user');
          }
        } catch {
          // ignore
        }
      }
    }

    if (!response.ok) {
      let errorMsg = `Request failed with status ${response.status}`;
      let validationErrors: string[] | undefined;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMsg = errorData.detail;
        }
        if (errorData.validation_errors) {
          validationErrors = errorData.validation_errors;
        }
      } catch {
        // Response was not JSON
      }
      throw new ApiError(errorMsg, response.status, validationErrors);
    }

    return (await response.json()) as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Network request failed';
    throw new ApiError(message, 0);
  }
}
