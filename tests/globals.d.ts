import type { ExpectMatcher, MockFn, RenderResult } from "./test-utils";

declare global {
  var describe: (name: string, fn: () => void | Promise<void>) => void;
  var it: (name: string, fn: () => void | Promise<void>) => void;
  var test: (name: string, fn: () => void | Promise<void>) => void;
  var beforeEach: (fn: () => void | Promise<void>) => void;
  var afterEach: (fn: () => void | Promise<void>) => void;
  var beforeAll: (fn: () => void | Promise<void>) => void;
  var afterAll: (fn: () => void | Promise<void>) => void;
  var expect: <T = any>(actual: T) => ExpectMatcher<T>;
  var vi: {
    fn: <Args extends any[] = any[], Return = any>(initialImpl?: (...args: Args) => Return) => MockFn<Args, Return>;
    spyOn: <T extends Record<string, any>, K extends keyof T>(obj: T, method: K) => MockFn;
    clearAllMocks: () => void;
    resetAllMocks: () => void;
    restoreAllMocks: () => void;
  };
  var render: (ui: React.ReactElement) => RenderResult;
  var fireEvent: {
    click: (target: any, event?: any) => any;
    change: (target: any, event?: any) => any;
    keyDown: (target: any, event?: any) => any;
    submit: (target: any, event?: any) => any;
  };
}

export {};
