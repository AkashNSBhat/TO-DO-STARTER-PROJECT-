import React from "react";
import ReactDOMServer from "react-dom/server";
import assert from "node:assert";
import {
  describe as nodeDescribe,
  it as nodeIt,
  test as nodeTest,
  beforeEach as nodeBeforeEach,
  afterEach as nodeAfterEach,
  before as nodeBefore,
  after as nodeAfter,
} from "node:test";

// =============================================================
// Re-export Test Lifecycle from node:test
// =============================================================

export const describe = nodeDescribe;
export const it = nodeIt;
export const test = nodeTest;
export const beforeEach = nodeBeforeEach;
export const afterEach = nodeAfterEach;
export const beforeAll = nodeBefore;
export const afterAll = nodeAfter;
export const before = nodeBefore;
export const after = nodeAfter;

// =============================================================
// Mock Spy System (vi.fn, vi.spyOn)
// =============================================================

export interface MockFn<Args extends any[] = any[], Return = any> {
  (...args: Args): Return;
  mock: {
    calls: Args[];
    results: Array<{ type: "return" | "throw"; value: Return }>;
    instances: any[];
  };
  mockReturnValue(val: Return): MockFn<Args, Return>;
  mockReturnValueOnce(val: Return): MockFn<Args, Return>;
  mockResolvedValue(val: any): MockFn<Args, any>;
  mockResolvedValueOnce(val: any): MockFn<Args, any>;
  mockRejectedValue(val: any): MockFn<Args, any>;
  mockRejectedValueOnce(val: any): MockFn<Args, any>;
  mockImplementation(fn: (...args: Args) => Return): MockFn<Args, Return>;
  mockImplementationOnce(fn: (...args: Args) => Return): MockFn<Args, Return>;
  mockClear(): MockFn<Args, Return>;
  mockReset(): MockFn<Args, Return>;
  mockRestore(): void;
  _isMockFunction: true;
}

const activeSpies = new Set<() => void>();

export function createMockFn<Args extends any[] = any[], Return = any>(
  initialImpl?: (...args: Args) => Return
): MockFn<Args, Return> {
  let defaultImpl = initialImpl;
  const onceImpls: Array<(...args: Args) => Return> = [];

  const calls: Args[] = [];
  const results: Array<{ type: "return" | "throw"; value: Return }> = [];
  const instances: any[] = [];

  const fn = function (this: any, ...args: Args): Return {
    calls.push(args);
    instances.push(this);

    const currentImpl = onceImpls.shift() || defaultImpl;
    if (currentImpl) {
      try {
        const val = currentImpl.apply(this, args);
        results.push({ type: "return", value: val });
        return val;
      } catch (err: any) {
        results.push({ type: "throw", value: err });
        throw err;
      }
    }
    results.push({ type: "return", value: undefined as any });
    return undefined as any;
  } as MockFn<Args, Return>;

  fn._isMockFunction = true;
  fn.mock = { calls, results, instances };

  fn.mockReturnValue = (val: Return) => {
    defaultImpl = () => val;
    return fn;
  };
  fn.mockReturnValueOnce = (val: Return) => {
    onceImpls.push(() => val);
    return fn;
  };
  fn.mockResolvedValue = (val: any) => {
    defaultImpl = () => Promise.resolve(val) as any;
    return fn;
  };
  fn.mockResolvedValueOnce = (val: any) => {
    onceImpls.push(() => Promise.resolve(val) as any);
    return fn;
  };
  fn.mockRejectedValue = (val: any) => {
    defaultImpl = () => Promise.reject(val) as any;
    return fn;
  };
  fn.mockRejectedValueOnce = (val: any) => {
    onceImpls.push(() => Promise.reject(val) as any);
    return fn;
  };
  fn.mockImplementation = (impl: (...args: Args) => Return) => {
    defaultImpl = impl;
    return fn;
  };
  fn.mockImplementationOnce = (impl: (...args: Args) => Return) => {
    onceImpls.push(impl);
    return fn;
  };
  fn.mockClear = () => {
    calls.length = 0;
    results.length = 0;
    instances.length = 0;
    return fn;
  };
  fn.mockReset = () => {
    fn.mockClear();
    defaultImpl = undefined;
    onceImpls.length = 0;
    return fn;
  };
  fn.mockRestore = () => {
    fn.mockReset();
  };

  return fn;
}

export const vi = {
  fn: createMockFn,
  spyOn: <T extends Record<string, any>, K extends keyof T>(
    obj: T,
    method: K
  ): MockFn => {
    const original = obj[method];
    const spy = createMockFn(
      typeof original === "function" ? original.bind(obj) : undefined
    );
    obj[method] = spy as any;

    const restore = () => {
      obj[method] = original;
    };
    spy.mockRestore = restore;
    activeSpies.add(restore);

    return spy;
  },
  clearAllMocks: () => {
    // No-op for global list or cleared in spies
  },
  resetAllMocks: () => {},
  restoreAllMocks: () => {
    activeSpies.forEach((restore) => restore());
    activeSpies.clear();
  },
};

// =============================================================
// Micro-DOM AST & HTML Parser
// =============================================================

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export class DOMNode {
  public tagName: string;
  public attributes: Record<string, string>;
  public children: DOMNode[] = [];
  public parent: DOMNode | null = null;
  public rawText: string = "";
  public isTextNode: boolean = false;
  public _reactProps?: any;

  constructor(tagName = "DIV", attributes: Record<string, string> = {}, parent: DOMNode | null = null) {
    this.tagName = tagName.toUpperCase();
    this.attributes = { ...attributes };
    this.parent = parent;
  }

  getAttribute(name: string): string | null {
    return this.attributes[name.toLowerCase()] ?? null;
  }

  hasAttribute(name: string): boolean {
    return name.toLowerCase() in this.attributes;
  }

  setAttribute(name: string, value: string): void {
    this.attributes[name.toLowerCase()] = String(value);
  }

  get classList() {
    const classAttr = this.getAttribute("class") || this.getAttribute("className") || "";
    const classes = classAttr.split(/\s+/).filter(Boolean);
    return {
      contains: (cls: string) => classes.includes(cls),
      add: (...tokens: string[]) => {
        tokens.forEach((t) => {
          if (!classes.includes(t)) classes.push(t);
        });
        this.setAttribute("class", classes.join(" "));
      },
      remove: (...tokens: string[]) => {
        tokens.forEach((t) => {
          const idx = classes.indexOf(t);
          if (idx >= 0) classes.splice(idx, 1);
        });
        this.setAttribute("class", classes.join(" "));
      },
      get length() {
        return classes.length;
      },
      [Symbol.iterator]: () => classes[Symbol.iterator](),
      toArray: () => [...classes],
    };
  }

  get textContent(): string {
    if (this.isTextNode) {
      return decodeHtmlEntities(this.rawText);
    }
    return this.children.map((c) => c.textContent).join("");
  }

  get innerHTML(): string {
    return this.children.map((c) => c.outerHTML).join("");
  }

  get outerHTML(): string {
    if (this.isTextNode) return this.rawText;
    const attrs = Object.entries(this.attributes)
      .map(([k, v]) => ` ${k}="${v.replace(/"/g, "&quot;")}"`)
      .join("");
    return `<${this.tagName.toLowerCase()}${attrs}>${this.innerHTML}</${this.tagName.toLowerCase()}>`;
  }

  matches(selector: string): boolean {
    selector = selector.trim();
    if (!selector || this.isTextNode) return false;

    // ID selector: #id
    if (selector.startsWith("#")) {
      return this.getAttribute("id") === selector.slice(1);
    }

    // Attribute selector: [attr] or [attr="val"]
    if (selector.startsWith("[") && selector.endsWith("]")) {
      const inner = selector.slice(1, -1);
      const eqIdx = inner.indexOf("=");
      if (eqIdx === -1) {
        return this.hasAttribute(inner.trim());
      }
      const attrName = inner.slice(0, eqIdx).trim();
      let expectedVal = inner.slice(eqIdx + 1).trim();
      if ((expectedVal.startsWith('"') && expectedVal.endsWith('"')) || (expectedVal.startsWith("'") && expectedVal.endsWith("'"))) {
        expectedVal = expectedVal.slice(1, -1);
      }
      return this.getAttribute(attrName) === expectedVal;
    }

    // Class selector: .className
    if (selector.startsWith(".")) {
      const clsName = selector.slice(1);
      return this.classList.contains(clsName);
    }

    // Tag selector: button, div, etc.
    if (/^[a-zA-Z0-9]+$/.test(selector)) {
      return this.tagName === selector.toUpperCase();
    }

    // Compound selector: tag.class or tag[attr]
    const compoundMatch = selector.match(/^([a-zA-Z0-9]+)(\..+|\[.+\])$/);
    if (compoundMatch) {
      const [, tag, rest] = compoundMatch;
      if (this.tagName !== tag.toUpperCase()) return false;
      return this.matches(rest);
    }

    return false;
  }

  querySelector(selector: string): DOMNode | null {
    const list = this.querySelectorAll(selector);
    return list.length > 0 ? list[0] : null;
  }

  querySelectorAll(selector: string): DOMNode[] {
    const results: DOMNode[] = [];
    const walk = (node: DOMNode) => {
      for (const child of node.children) {
        if (!child.isTextNode && child.matches(selector)) {
          results.push(child);
        }
        walk(child);
      }
    };
    walk(this);
    return results;
  }

  getByText(textOrRegex: string | RegExp): DOMNode {
    const found = this.queryByText(textOrRegex);
    if (!found) {
      throw new Error(`Unable to find an element with text: ${textOrRegex}`);
    }
    return found;
  }

  queryByText(textOrRegex: string | RegExp): DOMNode | null {
    const all = this.getAllByText(textOrRegex);
    return all.length > 0 ? all[0] : null;
  }

  getAllByText(textOrRegex: string | RegExp): DOMNode[] {
    const results: DOMNode[] = [];
    const walk = (node: DOMNode) => {
      if (!node.isTextNode) {
        const text = node.textContent.trim();
        const matches =
          typeof textOrRegex === "string"
            ? text === textOrRegex || text.includes(textOrRegex)
            : textOrRegex.test(text);

        // Only leaf or deepest elements that contain the text
        if (matches) {
          const directChildMatch = node.children.some((c) => {
            if (c.isTextNode) return false;
            const childText = c.textContent.trim();
            return typeof textOrRegex === "string"
              ? childText === textOrRegex || childText.includes(textOrRegex)
              : textOrRegex.test(childText);
          });
          if (!directChildMatch) {
            results.push(node);
          }
        }
      }
      for (const child of node.children) {
        walk(child);
      }
    };
    walk(this);
    return results;
  }

  getByRole(role: string): DOMNode {
    const found = this.getAllByRole(role);
    if (found.length === 0) {
      throw new Error(`Unable to find an element with role: "${role}"`);
    }
    return found[0];
  }

  getAllByRole(role: string): DOMNode[] {
    const results: DOMNode[] = [];
    const roleLower = role.toLowerCase();

    const walk = (node: DOMNode) => {
      if (!node.isTextNode) {
        const explicitRole = node.getAttribute("role");
        if (explicitRole && explicitRole.toLowerCase() === roleLower) {
          results.push(node);
        } else {
          // Implicit HTML roles
          const tag = node.tagName.toLowerCase();
          const type = (node.getAttribute("type") || "").toLowerCase();
          if (roleLower === "button" && tag === "button") results.push(node);
          else if (roleLower === "textbox" && tag === "input" && (type === "" || type === "text" || type === "search")) results.push(node);
          else if (roleLower === "checkbox" && tag === "input" && type === "checkbox") results.push(node);
          else if (roleLower === "link" && tag === "a" && node.hasAttribute("href")) results.push(node);
          else if (roleLower === "progressbar" && (tag === "progress" || node.getAttribute("role") === "progressbar")) results.push(node);
          else if (roleLower === "tab" && node.getAttribute("role") === "tab") results.push(node);
          else if (roleLower === "tablist" && node.getAttribute("role") === "tablist") results.push(node);
          else if (roleLower === "tabpanel" && node.getAttribute("role") === "tabpanel") results.push(node);
        }
      }
      for (const child of node.children) {
        walk(child);
      }
    };
    walk(this);
    return results;
  }

  getByTestId(testId: string): DOMNode {
    const node = this.querySelector(`[data-testid="${testId}"]`);
    if (!node) {
      throw new Error(`Unable to find an element with data-testid: "${testId}"`);
    }
    return node;
  }

  getByPlaceholderText(textOrRegex: string | RegExp): DOMNode {
    const inputs = this.querySelectorAll("input, textarea");
    for (const input of inputs) {
      const placeholder = input.getAttribute("placeholder") || "";
      const matches =
        typeof textOrRegex === "string"
          ? placeholder.includes(textOrRegex)
          : textOrRegex.test(placeholder);
      if (matches) return input;
    }
    throw new Error(`Unable to find an element with placeholder: ${textOrRegex}`);
  }
}

const VOID_TAGS = new Set([
  "AREA", "BASE", "BR", "COL", "EMBED", "HR", "IMG", "INPUT", "LINK", "META",
  "PARAM", "SOURCE", "TRACK", "WBR", "PATH", "CIRCLE", "RECT", "LINE", "POLYLINE", "POLYGON"
]);

export function parseHtml(html: string): DOMNode {
  const root = new DOMNode("DIV");
  let current: DOMNode = root;

  // Tag matcher: captures <tag ...>, </tag>, or text
  const tagRegex = /<(\/)?([a-zA-Z0-9:-]+)([^>]*)>|([^<]+)/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html)) !== null) {
    const [full, isClosing, tagName, rawAttrs, textContent] = match;

    if (textContent) {
      const trimmed = textContent;
      if (trimmed) {
        const textNode = new DOMNode("#TEXT", {}, current);
        textNode.isTextNode = true;
        textNode.rawText = trimmed;
        current.children.push(textNode);
      }
      continue;
    }

    if (isClosing) {
      if (current.parent) {
        current = current.parent;
      }
      continue;
    }

    // Opening tag
    const attributes: Record<string, string> = {};
    if (rawAttrs) {
      const attrRegex = /([a-zA-Z0-9_:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      let attrMatch: RegExpExecArray | null;
      while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
        const [, attrName, valDbl, valSgl, valBare] = attrMatch;
        const val = valDbl !== undefined ? valDbl : valSgl !== undefined ? valSgl : valBare !== undefined ? valBare : "";
        attributes[attrName.toLowerCase()] = val;
      }
    }

    const node = new DOMNode(tagName, attributes, current);
    current.children.push(node);

    const isSelfClosing = full.endsWith("/>") || VOID_TAGS.has(tagName.toUpperCase());
    if (!isSelfClosing) {
      current = node;
    }
  }

  return root;
}

// =============================================================
// React Render & fireEvent System
// =============================================================

export interface RenderResult {
  container: DOMNode;
  getByText: (text: string | RegExp) => DOMNode;
  queryByText: (text: string | RegExp) => DOMNode | null;
  getAllByText: (text: string | RegExp) => DOMNode[];
  getByRole: (role: string) => DOMNode;
  getAllByRole: (role: string) => DOMNode[];
  getByTestId: (testId: string) => DOMNode;
  getByPlaceholderText: (text: string | RegExp) => DOMNode;
  html: string;
  debug: () => void;
  rerender: (ui: React.ReactElement) => void;
  unmount: () => void;
}

function linkReactProps(domNode: DOMNode, reactElement: any) {
  if (!reactElement || typeof reactElement !== "object") return;

  domNode._reactProps = reactElement.props;

  // If container is root DIV with single top-level child element, also attach to top child
  if (domNode.tagName === "DIV" && domNode.children.length === 1 && !domNode.children[0].isTextNode) {
    domNode.children[0]._reactProps = reactElement.props;
  }

  const children = React.Children.toArray(reactElement.props?.children);
  const elementChildren = domNode.children.filter((c) => !c.isTextNode);

  for (let i = 0; i < Math.min(children.length, elementChildren.length); i++) {
    linkReactProps(elementChildren[i], children[i]);
  }
}

export function render(ui: React.ReactElement): RenderResult {
  let currentUi = ui;
  let html = ReactDOMServer.renderToString(currentUi);
  let container = parseHtml(html);
  linkReactProps(container, currentUi);

  const result: RenderResult = {
    get container() {
      return container;
    },
    get html() {
      return html;
    },
    getByText: (t) => container.getByText(t),
    queryByText: (t) => container.queryByText(t),
    getAllByText: (t) => container.getAllByText(t),
    getByRole: (r) => container.getByRole(r),
    getAllByRole: (r) => container.getAllByRole(r),
    getByTestId: (id) => container.getByTestId(id),
    getByPlaceholderText: (p) => container.getByPlaceholderText(p),
    debug: () => {
      console.log(html);
    },
    rerender: (newUi: React.ReactElement) => {
      currentUi = newUi;
      html = ReactDOMServer.renderToString(currentUi);
      container = parseHtml(html);
      linkReactProps(container, currentUi);
    },
    unmount: () => {
      container = parseHtml("");
    },
  };

  return result;
}

export const fireEvent = {
  click: (target: any, event: any = {}) => {
    const syntheticEvent = {
      preventDefault: () => {},
      stopPropagation: () => {},
      target: target?.attributes ?? {},
      ...event,
    };

    let curr = target;
    while (curr) {
      if (curr?.props?.onClick) {
        return curr.props.onClick(syntheticEvent);
      }
      if (curr?._reactProps?.onClick) {
        return curr._reactProps.onClick(syntheticEvent);
      }
      if (typeof curr?.onClick === "function") {
        return curr.onClick(syntheticEvent);
      }
      curr = curr.parent;
    }
  },

  change: (target: any, event: any = {}) => {
    const val =
      event?.target?.value !== undefined
        ? event.target.value
        : event?.value !== undefined
        ? event.value
        : typeof event === "string"
        ? event
        : "";

    const syntheticEvent = {
      preventDefault: () => {},
      stopPropagation: () => {},
      target: { value: val },
      ...event,
    };

    let curr = target;
    while (curr) {
      const handler = curr?.props?.onChange || curr?._reactProps?.onChange || curr?.onChange;
      if (typeof handler === "function") {
        if (handler.length === 1) {
          try {
            return handler(val);
          } catch {
            return handler(syntheticEvent);
          }
        }
        return handler(syntheticEvent);
      }
      curr = curr.parent;
    }
  },

  keyDown: (target: any, event: any = {}) => {
    const syntheticEvent = {
      preventDefault: () => {},
      stopPropagation: () => {},
      key: event?.key || "Enter",
      ...event,
    };

    let curr = target;
    while (curr) {
      const handler = curr?.props?.onKeyDown || curr?._reactProps?.onKeyDown || curr?.onKeyDown;
      if (typeof handler === "function") {
        return handler(syntheticEvent);
      }
      curr = curr.parent;
    }
  },

  submit: (target: any, event: any = {}) => {
    const syntheticEvent = {
      preventDefault: () => {},
      stopPropagation: () => {},
      ...event,
    };
    let curr = target;
    while (curr) {
      const handler = curr?.props?.onSubmit || curr?._reactProps?.onSubmit || curr?.onSubmit;
      if (typeof handler === "function") {
        return handler(syntheticEvent);
      }
      curr = curr.parent;
    }
  },
};

// =============================================================
// Matcher Implementation (expect)
// =============================================================

export interface ExpectMatcher<T = any> {
  not: ExpectMatcher<T>;
  toBe(expected: any): void;
  toEqual(expected: any): void;
  toBeDefined(): void;
  toBeUndefined(): void;
  toBeNull(): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeGreaterThan(n: number): void;
  toBeGreaterThanOrEqual(n: number): void;
  toBeLessThan(n: number): void;
  toBeLessThanOrEqual(n: number): void;
  toContain(item: any): void;
  toMatch(regexOrStr: RegExp | string): void;
  toHaveLength(length: number): void;
  toThrow(expectedError?: string | RegExp): void;

  // DOM Matchers
  toBeInTheDocument(): void;
  toHaveClass(...classNames: string[]): void;
  toHaveAttribute(attr: string, value?: string): void;
  toHaveTextContent(textOrRegex: string | RegExp): void;
  toBeVisible(): void;
  toBeDisabled(): void;
  toBeEnabled(): void;

  // Spy Matchers
  toHaveBeenCalled(): void;
  toHaveBeenCalledTimes(count: number): void;
  toHaveBeenCalledWith(...args: any[]): void;

  // Async resolves / rejects
  resolves: ExpectMatcher<T>;
  rejects: ExpectMatcher<T>;
}

function buildExpectMatcher<T>(actual: T, isNot = false): ExpectMatcher<T> {
  const check = (condition: boolean, failMessage: string) => {
    const pass = isNot ? !condition : condition;
    if (!pass) {
      throw new assert.AssertionError({
        message: isNot ? `Expected NOT to: ${failMessage}` : `Expected: ${failMessage}`,
        actual,
      });
    }
  };

  const matcher: ExpectMatcher<T> = {
    get not() {
      return buildExpectMatcher(actual, !isNot);
    },

    get resolves(): any {
      return (async () => {
        const resolvedVal = await (actual as any);
        return buildExpectMatcher(resolvedVal, isNot);
      })();
    },

    get rejects(): any {
      return (async () => {
        try {
          await (actual as any);
        } catch (err) {
          return buildExpectMatcher(err, isNot);
        }
        throw new assert.AssertionError({
          message: "Expected promise to reject, but it resolved successfully.",
        });
      })();
    },

    toBe: (expected: any) => {
      check(Object.is(actual, expected), `${actual} to be identical to ${expected}`);
    },

    toEqual: (expected: any) => {
      try {
        assert.deepStrictEqual(actual, expected);
        check(true, "equal");
      } catch {
        check(false, `${JSON.stringify(actual)} to deepEqual ${JSON.stringify(expected)}`);
      }
    },

    toBeDefined: () => {
      check(actual !== undefined, `${actual} to be defined`);
    },

    toBeUndefined: () => {
      check(actual === undefined, `${actual} to be undefined`);
    },

    toBeNull: () => {
      check(actual === null, `${actual} to be null`);
    },

    toBeTruthy: () => {
      check(Boolean(actual) === true, `${actual} to be truthy`);
    },

    toBeFalsy: () => {
      check(Boolean(actual) === false, `${actual} to be falsy`);
    },

    toBeGreaterThan: (n: number) => {
      check((actual as any) > n, `${actual} to be > ${n}`);
    },

    toBeGreaterThanOrEqual: (n: number) => {
      check((actual as any) >= n, `${actual} to be >= ${n}`);
    },

    toBeLessThan: (n: number) => {
      check((actual as any) < n, `${actual} to be < ${n}`);
    },

    toBeLessThanOrEqual: (n: number) => {
      check((actual as any) <= n, `${actual} to be <= ${n}`);
    },

    toContain: (item: any) => {
      if (typeof actual === "string") {
        check(actual.includes(item), `"${actual}" to contain "${item}"`);
      } else if (Array.isArray(actual)) {
        check(actual.includes(item), `${JSON.stringify(actual)} to contain ${JSON.stringify(item)}`);
      } else if (actual instanceof Set || actual instanceof Map) {
        check(actual.has(item), `Collection to contain key ${item}`);
      } else {
        check(false, `toContain received unsupported type: ${typeof actual}`);
      }
    },

    toMatch: (regexOrStr: RegExp | string) => {
      const str = String(actual);
      if (typeof regexOrStr === "string") {
        check(str.includes(regexOrStr), `"${str}" to match "${regexOrStr}"`);
      } else {
        check(regexOrStr.test(str), `"${str}" to match ${regexOrStr}`);
      }
    },

    toHaveLength: (len: number) => {
      const actualLen = (actual as any)?.length;
      check(actualLen === len, `length ${actualLen} to equal ${len}`);
    },

    toThrow: (expectedError?: string | RegExp) => {
      if (typeof actual !== "function") {
        throw new Error("toThrow requires actual value to be a function.");
      }
      let threw = false;
      let thrownError: any = null;
      try {
        (actual as any)();
      } catch (err: any) {
        threw = true;
        thrownError = err;
      }

      if (!expectedError) {
        check(threw, "function to throw an error");
      } else if (typeof expectedError === "string") {
        const msg = thrownError?.message || String(thrownError);
        check(threw && msg.includes(expectedError), `error message to contain "${expectedError}", got "${msg}"`);
      } else {
        const msg = thrownError?.message || String(thrownError);
        check(threw && expectedError.test(msg), `error message to match ${expectedError}, got "${msg}"`);
      }
    },

    // -------------------------------------------------------------
    // DOM Matchers
    // -------------------------------------------------------------
    toBeInTheDocument: () => {
      check(actual !== null && actual !== undefined, "element to be in the document");
    },

    toHaveClass: (...classNames: string[]) => {
      const node = actual as any;
      if (!node || typeof node.classList?.contains !== "function") {
        check(false, "node to be a valid DOM node with classList");
        return;
      }
      // Can pass multiple classes in a single string e.g. "bg-teal-500 font-semibold"
      const flatTokens = classNames.flatMap((c) => c.split(/\s+/).filter(Boolean));
      const allPresent = flatTokens.every((token) => node.classList.contains(token));
      check(
        allPresent,
        `element class "${node.classList.toArray?.()?.join(" ")}" to contain classes: ${flatTokens.join(", ")}`
      );
    },

    toHaveAttribute: (attr: string, value?: string) => {
      const node = actual as any;
      if (!node || typeof node.hasAttribute !== "function") {
        check(false, "node to be a valid DOM node");
        return;
      }
      const hasAttr = node.hasAttribute(attr);
      if (value === undefined) {
        check(hasAttr, `element to have attribute "${attr}"`);
      } else {
        const attrVal = node.getAttribute(attr);
        check(hasAttr && attrVal === value, `attribute "${attr}" to equal "${value}", got "${attrVal}"`);
      }
    },

    toHaveTextContent: (textOrRegex: string | RegExp) => {
      const node = actual as any;
      const text = (node?.textContent || "").trim();
      if (typeof textOrRegex === "string") {
        check(text.includes(textOrRegex.trim()), `textContent "${text}" to contain "${textOrRegex}"`);
      } else {
        check(textOrRegex.test(text), `textContent "${text}" to match ${textOrRegex}`);
      }
    },

    toBeVisible: () => {
      const node = actual as any;
      const ariaHidden = node?.getAttribute?.("aria-hidden") === "true";
      const style = node?.getAttribute?.("style") || "";
      const isHidden = ariaHidden || style.includes("display: none") || style.includes("visibility: hidden");
      check(!isHidden, "element to be visible");
    },

    toBeDisabled: () => {
      const node = actual as any;
      const isDisabled = node?.hasAttribute?.("disabled") || node?.getAttribute?.("aria-disabled") === "true";
      check(isDisabled, "element to be disabled");
    },

    toBeEnabled: () => {
      const node = actual as any;
      const isDisabled = node?.hasAttribute?.("disabled") || node?.getAttribute?.("aria-disabled") === "true";
      check(!isDisabled, "element to be enabled");
    },

    // -------------------------------------------------------------
    // Mock Spy Matchers
    // -------------------------------------------------------------
    toHaveBeenCalled: () => {
      const spy = actual as any;
      const count = spy?.mock?.calls?.length ?? 0;
      check(count > 0, `spy to have been called (called ${count} times)`);
    },

    toHaveBeenCalledTimes: (count: number) => {
      const spy = actual as any;
      const actualCount = spy?.mock?.calls?.length ?? 0;
      check(actualCount === count, `spy to be called ${count} times, but was called ${actualCount} times`);
    },

    toHaveBeenCalledWith: (...args: any[]) => {
      const spy = actual as any;
      const calls: any[][] = spy?.mock?.calls ?? [];
      const matched = calls.some((callArgs) => {
        try {
          assert.deepStrictEqual(callArgs, args);
          return true;
        } catch {
          return false;
        }
      });
      check(matched, `spy to have been called with ${JSON.stringify(args)}, calls were: ${JSON.stringify(calls)}`);
    },
  };

  return matcher;
}

export function expect<T = any>(actual: T): ExpectMatcher<T> {
  return buildExpectMatcher(actual);
}

// Attach globals to globalThis so tests can use either imported or global bindings
const g = globalThis as any;
g.describe = describe;
g.it = it;
g.test = test;
g.beforeEach = beforeEach;
g.afterEach = afterEach;
g.beforeAll = beforeAll;
g.afterAll = afterAll;
g.expect = expect;
g.vi = vi;
g.render = render;
g.fireEvent = fireEvent;
