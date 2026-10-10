import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./server";

// --- jsdom polyfills required by Radix UI primitives -----------------------
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
  ResizeObserverStub;

if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = vi.fn();
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = vi.fn();
}

// --- object URL polyfills ---------------------------------------------------
let objectUrlCounter = 0;
if (typeof URL.createObjectURL !== "function") {
  (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL =
    () => `blob:mock-${++objectUrlCounter}`;
}
if (typeof URL.revokeObjectURL !== "function") {
  (URL as unknown as { revokeObjectURL: (u: string) => void }).revokeObjectURL =
    () => {};
}

// --- MSW --------------------------------------------------------------------
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
