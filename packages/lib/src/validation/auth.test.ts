import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema } from "./auth";

describe("signInSchema", () => {
  it("accepts a valid sign-in payload", () => {
    const result = signInSchema.safeParse({
      email: "alex@example.com",
      password: "hunter2",
      rememberMe: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = signInSchema.safeParse({
      email: "not-an-email",
      password: "hunter2",
      rememberMe: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = signInSchema.safeParse({
      email: "alex@example.com",
      password: "",
      rememberMe: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("signUpSchema", () => {
  const basePayload = {
    fullName: "Alex Morgan",
    email: "alex@example.com",
    password: "supersecret",
    confirmPassword: "supersecret",
  };

  it("accepts a valid sign-up payload", () => {
    expect(signUpSchema.safeParse(basePayload).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = signUpSchema.safeParse({ ...basePayload, confirmPassword: "different" });
    expect(result.success).toBe(false);
  });

  it("rejects short passwords", () => {
    const result = signUpSchema.safeParse({
      ...basePayload,
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "alex@example.com" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts a valid payload", () => {
    const result = resetPasswordSchema.safeParse({
      password: "supersecret",
      confirmPassword: "supersecret",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "supersecret",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });
});
