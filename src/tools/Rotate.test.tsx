import { describe, it, expect, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Rotate from "./Rotate";
import { renderWithProviders } from "../test/renderWithProviders";
import { useAppStore } from "../store/useAppStore";
import { mockCommand, lastCallArgs } from "../test/mockTauri";

afterEach(() => useAppStore.setState({ files: [], result: null, isProcessing: false }));

function seedFile() {
  useAppStore.setState({
    files: [{ path: "in.pdf", name: "in.pdf", info: { page_count: 5, file_size: 10, metadata: {} } }],
  });
}

describe("Rotate tool", () => {
  it("rotates all pages by the chosen degrees and stores the result", async () => {
    seedFile();
    mockCommand("rotate_pages", "out.pdf");
    renderWithProviders(<Rotate />);

    await userEvent.click(screen.getByRole("button", { name: "180°" }));
    await userEvent.click(screen.getByRole("button", { name: /^Rotate Pages$/i }));

    await waitFor(() =>
      expect(lastCallArgs("rotate_pages")).toEqual({ path: "in.pdf", pages: [], degrees: 180 }),
    );
    await waitFor(() => expect(useAppStore.getState().result).toBe("out.pdf"));
  });

  it("rotates only the specified pages", async () => {
    seedFile();
    mockCommand("rotate_pages", "out.pdf");
    renderWithProviders(<Rotate />);

    await userEvent.click(screen.getByRole("button", { name: /specific pages/i }));
    const input = screen.getByPlaceholderText(/e\.g\. 1, 3-5, 7/i);
    await userEvent.clear(input);
    await userEvent.type(input, "2,4");
    await userEvent.click(screen.getByRole("button", { name: /^Rotate Pages$/i }));

    await waitFor(() =>
      expect(lastCallArgs("rotate_pages")).toEqual({ path: "in.pdf", pages: [2, 4], degrees: 90 }),
    );
  });
});
