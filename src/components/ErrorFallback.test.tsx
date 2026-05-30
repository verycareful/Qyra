import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorFallback } from "./ErrorFallback";

describe("ErrorFallback", () => {
  it("renders the error message and recovery actions", () => {
    render(<ErrorFallback error={new Error("kaboom")} resetErrorBoundary={() => {}} />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("kaboom")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("calls resetErrorBoundary on Try again", async () => {
    const reset = vi.fn();
    render(<ErrorFallback error={new Error("x")} resetErrorBoundary={reset} />);
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it("falls back to Unknown error for non-Error values", () => {
    render(<ErrorFallback error={"a string"} resetErrorBoundary={() => {}} />);
    expect(screen.getByText("Unknown error")).toBeInTheDocument();
  });
});
