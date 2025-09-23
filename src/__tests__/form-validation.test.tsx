/**
 * Form Validation Edge Cases Tests
 * 
 * Tests comprehensive form validation scenarios including:
 * - Input sanitization and XSS prevention
 * - Boundary conditions and edge cases
 * - Malformed data handling
 * - Unicode and special character support
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// Mock toast notifications
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Test form validation schemas
const emailSchema = z.string().email("Invalid email format");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters");
const nameSchema = z.string().min(1, "Name is required").max(100, "Name too long").refine(val => val.trim().length > 0, "Name cannot be only whitespace");

// Test form component
const TestForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    try {
      emailSchema.parse(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        newErrors.email = error.issues[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        newErrors.password = error.issues[0].message;
      }
    }

    try {
      nameSchema.parse(name);
    } catch (error) {
      if (error instanceof z.ZodError) {
        newErrors.name = error.issues[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({ email, password, name });
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="test-form">
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          data-testid="email-input"
        />
        {errors.email && <span data-testid="email-error">{errors.email}</span>}
      </div>
      
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          data-testid="password-input"
        />
        {errors.password && <span data-testid="password-error">{errors.password}</span>}
      </div>
      
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          data-testid="name-input"
        />
        {errors.name && <span data-testid="name-error">{errors.name}</span>}
      </div>
      
      <button type="submit" data-testid="submit-button">Submit</button>
    </form>
  );
};

describe("Form Validation Edge Cases", () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Email Validation Edge Cases", () => {
    it("should reject malformed email addresses", () => {
      const malformedEmails = [
        "",
        " ",
        "notanemail",
        "@domain.com",
        "user@",
        "user@domain",
        "user..double@domain.com",
        "user@domain..com",
        "user@domain.c",
        "user name@domain.com",
        "user@domain .com",
        "user@domain.com.",
        ".user@domain.com",
        "user@.domain.com",
      ];

      malformedEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).toThrow();
      });
    });

    it("should accept valid email addresses", async () => {
      const validEmails = [
        "user@domain.com",
        "user.name@domain.com",
        "user+tag@domain.com",
        "user123@domain123.com",
        "a@b.co",
        "test@subdomain.domain.com",
      ];

      for (const email of validEmails) {
        render(<TestForm onSubmit={mockOnSubmit} />);
        
        const emailInput = screen.getByTestId("email-input");
        const submitButton = screen.getByTestId("submit-button");

        fireEvent.change(emailInput, { target: { value: email } });
        fireEvent.change(screen.getByTestId("password-input"), { target: { value: "validpassword123" } });
        fireEvent.change(screen.getByTestId("name-input"), { target: { value: "Valid Name" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.queryByTestId("email-error")).not.toBeInTheDocument();
        });

        // Clean up for next iteration
        document.body.innerHTML = "";
        mockOnSubmit.mockClear();
      }
    });
  });

  describe("Password Validation Edge Cases", () => {
    it("should reject passwords that are too short", async () => {
      const shortPasswords = ["", "1", "12", "1234567"];

      for (const password of shortPasswords) {
        render(<TestForm onSubmit={mockOnSubmit} />);
        
        fireEvent.change(screen.getByTestId("email-input"), { target: { value: "test@example.com" } });
        fireEvent.change(screen.getByTestId("password-input"), { target: { value: password } });
        fireEvent.change(screen.getByTestId("name-input"), { target: { value: "Valid Name" } });
        fireEvent.click(screen.getByTestId("submit-button"));

        await waitFor(() => {
          expect(screen.getByTestId("password-error")).toBeInTheDocument();
          expect(mockOnSubmit).not.toHaveBeenCalled();
        });

        document.body.innerHTML = "";
      }
    });

    it("should handle special characters in passwords", async () => {
      const specialPasswords = [
        "password!@#$%^&*()",
        "pässwörd123",
        "密码123456",
        "🔒password123",
        "pass\nword123",
        "pass\tword123",
      ];

      for (const password of specialPasswords) {
        render(<TestForm onSubmit={mockOnSubmit} />);
        
        fireEvent.change(screen.getByTestId("email-input"), { target: { value: "test@example.com" } });
        fireEvent.change(screen.getByTestId("password-input"), { target: { value: password } });
        fireEvent.change(screen.getByTestId("name-input"), { target: { value: "Valid Name" } });
        fireEvent.click(screen.getByTestId("submit-button"));

        await waitFor(() => {
          if (password.length >= 8) {
            expect(screen.queryByTestId("password-error")).not.toBeInTheDocument();
          }
        });

        document.body.innerHTML = "";
        mockOnSubmit.mockClear();
      }
    });
  });

  describe("Name Validation Edge Cases", () => {
    it("should reject empty names", () => {
      const emptyNames = ["", " ", "   ", "\t", "\n"];

      emptyNames.forEach(name => {
        expect(() => nameSchema.parse(name)).toThrow();
      });
    });

    it("should handle unicode names", async () => {
      const unicodeNames = [
        "José García",
        "李小明",
        "محمد أحمد",
        "Владимир Петров",
        "Αλέξανδρος",
        "🎉 Party Name",
        "Müller-Schmidt",
      ];

      for (const name of unicodeNames) {
        render(<TestForm onSubmit={mockOnSubmit} />);
        
        fireEvent.change(screen.getByTestId("email-input"), { target: { value: "test@example.com" } });
        fireEvent.change(screen.getByTestId("password-input"), { target: { value: "validpassword123" } });
        fireEvent.change(screen.getByTestId("name-input"), { target: { value: name } });
        fireEvent.click(screen.getByTestId("submit-button"));

        await waitFor(() => {
          expect(screen.queryByTestId("name-error")).not.toBeInTheDocument();
        });

        document.body.innerHTML = "";
        mockOnSubmit.mockClear();
      }
    });

    it("should reject names that are too long", async () => {
      const longName = "a".repeat(101);
      
      render(<TestForm onSubmit={mockOnSubmit} />);
      
      fireEvent.change(screen.getByTestId("email-input"), { target: { value: "test@example.com" } });
      fireEvent.change(screen.getByTestId("password-input"), { target: { value: "validpassword123" } });
      fireEvent.change(screen.getByTestId("name-input"), { target: { value: longName } });
      fireEvent.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByTestId("name-error")).toBeInTheDocument();
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe("XSS Prevention", () => {
    it("should handle potential XSS payloads safely", async () => {
      const xssPayloads = [
        "<script>alert('xss')</script>",
        "javascript:alert('xss')",
        "<img src=x onerror=alert('xss')>",
        "'; DROP TABLE users; --",
        "<iframe src='javascript:alert(1)'></iframe>",
      ];

      for (const payload of xssPayloads) {
        render(<TestForm onSubmit={mockOnSubmit} />);
        
        fireEvent.change(screen.getByTestId("name-input"), { target: { value: payload } });
        
        // The payload should be treated as plain text, not executed
        expect(screen.getByTestId("name-input")).toHaveValue(payload);
        
        document.body.innerHTML = "";
      }
    });
  });

  describe("Input Sanitization", () => {
    it("should handle leading/trailing whitespace", () => {
      // Test that whitespace-only strings are rejected by validation
      expect(() => nameSchema.parse("   ")).toThrow();
      expect(() => nameSchema.parse("\t\n")).toThrow();

      // Test that valid strings with whitespace pass validation
      expect(() => nameSchema.parse("Valid Name")).not.toThrow();
      expect(() => emailSchema.parse("test@example.com")).not.toThrow();
    });

    it("should handle null bytes and control characters", async () => {
      const controlChars = [
        "name\x00with\x00nulls",
        "name\x01with\x02control",
        "name\x7Fwith\x1Fchars",
      ];

      for (const name of controlChars) {
        render(<TestForm onSubmit={mockOnSubmit} />);
        
        fireEvent.change(screen.getByTestId("name-input"), { target: { value: name } });
        
        // Input should accept the value (filtering should happen server-side)
        expect(screen.getByTestId("name-input")).toHaveValue(name);
        
        document.body.innerHTML = "";
      }
    });
  });
});
