import { setupTauriIpcMock, resetMockDb } from "./mocks/tauriMock";

// =============================================================
// Window & Global Object Initialization
// =============================================================

if (typeof (globalThis as any).window === "undefined") {
  (globalThis as any).window = globalThis;
}

const win = (globalThis as any).window;

// =============================================================
// In-Memory localStorage Mock
// =============================================================

class LocalStorageMock implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

const localStorageInstance = new LocalStorageMock();
Object.defineProperty(win, "localStorage", {
  value: localStorageInstance,
  writable: true,
  configurable: true,
});
(globalThis as any).localStorage = localStorageInstance;

// =============================================================
// window.matchMedia Mock
// =============================================================

win.matchMedia = win.matchMedia || function (query: string) {
  // Support dark mode query detection by default
  const isDarkQuery = query.includes("prefers-color-scheme: dark");

  return {
    matches: isDarkQuery, // dark mode default
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  };
};

// =============================================================
// window.ResizeObserver Mock
// =============================================================

class ResizeObserverMock {
  observe(_target: any, _options?: any): void {}
  unobserve(_target: any): void {}
  disconnect(): void {}
}

win.ResizeObserver = win.ResizeObserver || ResizeObserverMock;
(globalThis as any).ResizeObserver = win.ResizeObserver;

// =============================================================
// Minimal In-Memory Document Mock (for useTheme & DOM attributes)
// =============================================================

class ClassListMock {
  private classes = new Set<string>();

  constructor(initial = "") {
    initial.split(/\s+/).filter(Boolean).forEach((c) => this.classes.add(c));
  }

  add(...tokens: string[]): void {
    tokens.forEach((t) => this.classes.add(t));
  }

  remove(...tokens: string[]): void {
    tokens.forEach((t) => this.classes.delete(t));
  }

  contains(token: string): boolean {
    return this.classes.has(token);
  }

  toggle(token: string, force?: boolean): boolean {
    if (force !== undefined) {
      if (force) this.classes.add(token);
      else this.classes.delete(token);
      return force;
    }
    if (this.classes.has(token)) {
      this.classes.delete(token);
      return false;
    } else {
      this.classes.add(token);
      return true;
    }
  }

  get value(): string {
    return Array.from(this.classes).join(" ");
  }

  [Symbol.iterator]() {
    return this.classes.values();
  }
}

interface MockElement {
  tagName: string;
  classList: ClassListMock;
  style: Record<string, string>;
  attributes: Record<string, string>;
  getAttribute(name: string): string | null;
  setAttribute(name: string, val: string): void;
  removeAttribute(name: string): void;
}

function createMockElement(tagName: string): MockElement {
  const classList = new ClassListMock();
  const attributes: Record<string, string> = {};
  const style: Record<string, string> = {};

  return {
    tagName: tagName.toUpperCase(),
    classList,
    style,
    attributes,
    getAttribute(name: string) {
      if (name.toLowerCase() === "class") return classList.value;
      return attributes[name.toLowerCase()] ?? null;
    },
    setAttribute(name: string, val: string) {
      if (name.toLowerCase() === "class") {
        classList.remove(...Array.from(classList));
        classList.add(...val.split(/\s+/).filter(Boolean));
      }
      attributes[name.toLowerCase()] = String(val);
    },
    removeAttribute(name: string) {
      delete attributes[name.toLowerCase()];
    },
  };
}

if (typeof (globalThis as any).document === "undefined") {
  const documentElement = createMockElement("html");
  documentElement.classList.add("dark");
  documentElement.style.colorScheme = "dark";

  const body = createMockElement("body");

  (globalThis as any).document = {
    documentElement,
    body,
    createElement: (tag: string) => createMockElement(tag),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  };
}

// =============================================================
// Tauri Mock IPC Initialization
// =============================================================

setupTauriIpcMock();

/**
 * Global test environment reset helper
 */
export function resetTestEnvironment() {
  resetMockDb();
  localStorage.clear();
  if (globalThis.document?.documentElement) {
    globalThis.document.documentElement.classList.remove("light");
    globalThis.document.documentElement.classList.add("dark");
    globalThis.document.documentElement.style.colorScheme = "dark";
  }
}
