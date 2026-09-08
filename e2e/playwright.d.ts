/**
 * Ambient type declarations for @playwright/test
 * Enables zero-error IDE type-checking and autocompletion for E2E tests.
 */
declare module '@playwright/test' {
  export interface Page {
    goto(url: string, options?: any): Promise<any>;
    locator(selector: string, options?: any): Locator;
    title(): Promise<string>;
    waitForSelector(selector: string, options?: any): Promise<any>;
    waitForTimeout(timeout: number): Promise<void>;
  }

  export interface Locator {
    first(): Locator;
    last(): Locator;
    nth(index: number): Locator;
    isVisible(options?: any): Promise<boolean>;
    click(options?: any): Promise<void>;
    fill(value: string, options?: any): Promise<void>;
    press(key: string, options?: any): Promise<void>;
    textContent(options?: any): Promise<string | null>;
    count(): Promise<number>;
  }

  export interface ExpectMatcher {
    toBe(expected: any): void;
    toEqual(expected: any): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeVisible(options?: { timeout?: number }): Promise<void>;
    toHaveTitle(expected: string | RegExp): Promise<void>;
    toContainText(expected: string | RegExp): Promise<void>;
  }

  export interface Expect {
    (actual: any): ExpectMatcher;
  }

  export interface TestFn {
    (name: string, fn: (args: { page: Page }) => Promise<void>): void;
    describe(name: string, fn: () => void): void;
    beforeEach(fn: (args: { page: Page }) => Promise<void>): void;
    afterEach(fn: (args: { page: Page }) => Promise<void>): void;
    step(name: string, fn: () => Promise<void>): Promise<void>;
    skip(name: string, fn?: any): void;
    only(name: string, fn?: any): void;
  }

  export const test: TestFn;
  export const expect: Expect;
  export function defineConfig(config: any): any;
  export const devices: Record<string, any>;
}
