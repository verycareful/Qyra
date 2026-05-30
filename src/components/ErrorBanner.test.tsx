import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBanner } from "./ErrorBanner";

describe("ErrorBanner", () => {
  it("renders the error message", () => {
    render(<ErrorBanner error="Disk full" />);
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Disk full")).toBeInTheDocument();
  });

  it("shows a dismiss button that fires onDismiss", async () => {
    const onDismiss = vi.fn();
    render(<ErrorBanner error="boom" onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("omits the dismiss button when no handler is given", () => {
    render(<ErrorBanner error="boom" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
