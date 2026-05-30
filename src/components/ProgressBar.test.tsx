import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar, Spinner } from "./ProgressBar";

describe("ProgressBar", () => {
  it("renders the rounded percentage and message", () => {
    render(<ProgressBar current={1} total={4} message="Merging" />);
    expect(screen.getByText("Merging")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  it("shows 0% when total is zero", () => {
    render(<ProgressBar current={3} total={0} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("Processing…")).toBeInTheDocument();
  });
});

describe("Spinner", () => {
  it("renders the provided label", () => {
    render(<Spinner label="Loading pages" />);
    expect(screen.getByText("Loading pages")).toBeInTheDocument();
  });
});
