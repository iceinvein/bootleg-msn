/**
 * Network Error Handling Tests
 * 
 * Tests network failures, API errors, timeout scenarios, and retry mechanisms
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { toast } from "sonner";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock toast notifications
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
  },
}));

// Mock Convex mutations
const mockUseMutation = vi.fn();
vi.mock("convex/react", () => ({
  useMutation: () => mockUseMutation,
}));

// Test component that makes network requests
const NetworkTestComponent = ({ 
  endpoint = "/api/test",
  onSuccess,
  onError 
}: {
  endpoint?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}) => {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);

  const makeRequest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result);
      onSuccess?.(result);
      toast.success("Request successful");
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={makeRequest} disabled={loading} data-testid="request-button">
        {loading ? "Loading..." : "Make Request"}
      </button>
      {data && <div data-testid="success-data">{JSON.stringify(data)}</div>}
      {error && <div data-testid="error-message">{error.message}</div>}
    </div>
  );
};

// Component with retry logic
const RetryComponent = ({ maxRetries = 3 }: { maxRetries?: number }) => {
  const [retryCount, setRetryCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const makeRequestWithRetry = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch("/api/retry-test");
        
        if (response.ok) {
          setSuccess(true);
          setRetryCount(attempt);
          break;
        } else if (attempt === maxRetries) {
          throw new Error(`Failed after ${maxRetries + 1} attempts`);
        }
      } catch (err) {
        if (attempt === maxRetries) {
          setError((err as Error).message);
          setRetryCount(attempt + 1);
        }
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        }
      }
    }
    
    setLoading(false);
  };

  return (
    <div>
      <button onClick={makeRequestWithRetry} disabled={loading} data-testid="retry-button">
        {loading ? "Retrying..." : "Request with Retry"}
      </button>
      <div data-testid="retry-count">Attempts: {retryCount}</div>
      {success && <div data-testid="retry-success">Success!</div>}
      {error && <div data-testid="retry-error">{error}</div>}
    </div>
  );
};

describe("Network Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("HTTP Status Code Errors", () => {
    it("should handle 400 Bad Request", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () => Promise.resolve({ error: "Invalid request data" }),
      });

      const onError = vi.fn();
      render(<NetworkTestComponent onError={onError} />);

      fireEvent.click(screen.getByTestId("request-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent("HTTP 400: Bad Request");
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
        expect(toast.error).toHaveBeenCalledWith("HTTP 400: Bad Request");
      });
    });

    it("should handle 401 Unauthorized", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: () => Promise.resolve({ error: "Authentication required" }),
      });

      render(<NetworkTestComponent />);

      fireEvent.click(screen.getByTestId("request-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent("HTTP 401: Unauthorized");
      });
    });

    it("should handle 403 Forbidden", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: () => Promise.resolve({ error: "Access denied" }),
      });

      render(<NetworkTestComponent />);

      fireEvent.click(screen.getByTestId("request-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent("HTTP 403: Forbidden");
      });
    });

    it("should handle 404 Not Found", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () => Promise.resolve({ error: "Resource not found" }),
      });

      render(<NetworkTestComponent />);

      fireEvent.click(screen.getByTestId("request-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent("HTTP 404: Not Found");
      });
    });

    it("should handle 500 Internal Server Error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.resolve({ error: "Server error" }),
      });

      render(<NetworkTestComponent />);

      fireEvent.click(screen.getByTestId("request-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent("HTTP 500: Internal Server Error");
      });
    });

    it("should handle 503 Service Unavailable", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        json: () => Promise.resolve({ error: "Service temporarily unavailable" }),
      });

      render(<NetworkTestComponent />);

      fireEvent.click(screen.getByTestId("request-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent("HTTP 503: Service Unavailable");
      });
    });
  });

  describe("Network Failures", () => {
    it("should handle network connection errors", async () => {
      mockFetch.mockRejectedValue(new Error("Failed to fetch"));

      render(<NetworkTestComponent />);

      fireEvent.click(screen.getByTestId("request-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent("Failed to fetch");
        expect(toast.error).toHaveBeenCalledWith("Failed to fetch");
      });
    });

    it("should handle timeout errors", async () => {
      mockFetch.mockRejectedValue(new Error("Request timeout"));

      render(<NetworkTestComponent />);

      fireEvent.click(screen.getByTestId("request-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent("Request timeout");
      });
    });

    it("should handle DNS resolution failures", async () => {
      mockFetch.mockRejectedValue(new Error("getaddrinfo ENOTFOUND"));

      render(<NetworkTestComponent />);

      fireEvent.click(screen.getByTestId("request-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent("getaddrinfo ENOTFOUND");
      });
    });

    it("should handle connection refused", async () => {
      mockFetch.mockRejectedValue(new Error("connect ECONNREFUSED"));

      render(<NetworkTestComponent />);

      fireEvent.click(screen.getByTestId("request-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent("connect ECONNREFUSED");
      });
    });
  });

  describe("JSON Parsing Errors", () => {
    it("should handle malformed JSON responses", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error("Unexpected token in JSON")),
      });

      render(<NetworkTestComponent />);

      fireEvent.click(screen.getByTestId("request-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent("Unexpected token in JSON");
      });
    });

    it("should handle empty responses", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error("Unexpected end of JSON input")),
      });

      render(<NetworkTestComponent />);

      fireEvent.click(screen.getByTestId("request-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent("Unexpected end of JSON input");
      });
    });
  });

  describe("Retry Mechanisms", () => {
    it("should retry failed requests and eventually succeed", async () => {
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      render(<RetryComponent maxRetries={3} />);

      fireEvent.click(screen.getByTestId("retry-button"));

      await waitFor(() => {
        expect(screen.getByTestId("retry-success")).toBeInTheDocument();
        expect(screen.getByTestId("retry-count")).toHaveTextContent("Attempts: 2");
      }, { timeout: 5000 });

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should fail after maximum retries", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      render(<RetryComponent maxRetries={2} />);

      fireEvent.click(screen.getByTestId("retry-button"));

      await waitFor(() => {
        expect(screen.getByTestId("retry-error")).toHaveTextContent("Failed after 3 attempts");
        expect(screen.getByTestId("retry-count")).toHaveTextContent("Attempts: 3");
      }, { timeout: 5000 });

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should handle network errors during retry", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      render(<RetryComponent maxRetries={1} />);

      fireEvent.click(screen.getByTestId("retry-button"));

      await waitFor(() => {
        expect(screen.getByTestId("retry-error")).toHaveTextContent("Network error");
        expect(screen.getByTestId("retry-count")).toHaveTextContent("Attempts: 2");
      }, { timeout: 3000 });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("Convex Mutation Errors", () => {
    it("should handle Convex mutation failures", async () => {
      const mockError = new Error("Convex mutation failed");
      mockUseMutation.mockRejectedValue(mockError);

      const ConvexTestComponent = () => {
        const [error, setError] = React.useState<string | null>(null);
        const mutation = mockUseMutation;

        const handleMutation = async () => {
          try {
            await mutation({ data: "test" });
          } catch (err) {
            setError((err as Error).message);
            toast.error((err as Error).message);
          }
        };

        return (
          <div>
            <button onClick={handleMutation} data-testid="mutation-button">
              Execute Mutation
            </button>
            {error && <div data-testid="mutation-error">{error}</div>}
          </div>
        );
      };

      render(<ConvexTestComponent />);

      fireEvent.click(screen.getByTestId("mutation-button"));

      await waitFor(() => {
        expect(screen.getByTestId("mutation-error")).toHaveTextContent("Convex mutation failed");
        expect(toast.error).toHaveBeenCalledWith("Convex mutation failed");
      });
    });

    it("should handle Convex validation errors", async () => {
      const validationError = new Error("Validation failed: Invalid input");
      mockUseMutation.mockRejectedValue(validationError);

      const ConvexValidationComponent = () => {
        const [error, setError] = React.useState<string | null>(null);
        const mutation = mockUseMutation;

        const handleMutation = async () => {
          try {
            await mutation({ invalidData: true });
          } catch (err) {
            setError((err as Error).message);
          }
        };

        return (
          <div>
            <button onClick={handleMutation} data-testid="validation-button">
              Submit Invalid Data
            </button>
            {error && <div data-testid="validation-error">{error}</div>}
          </div>
        );
      };

      render(<ConvexValidationComponent />);

      fireEvent.click(screen.getByTestId("validation-button"));

      await waitFor(() => {
        expect(screen.getByTestId("validation-error")).toHaveTextContent("Validation failed: Invalid input");
      });
    });
  });

  describe("Successful Requests", () => {
    it("should handle successful requests", async () => {
      const mockData = { message: "Success", data: [1, 2, 3] };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const onSuccess = vi.fn();
      render(<NetworkTestComponent onSuccess={onSuccess} />);

      fireEvent.click(screen.getByTestId("request-button"));

      await waitFor(() => {
        expect(screen.getByTestId("success-data")).toHaveTextContent(JSON.stringify(mockData));
        expect(onSuccess).toHaveBeenCalledWith(mockData);
        expect(toast.success).toHaveBeenCalledWith("Request successful");
      });
    });
  });
});
