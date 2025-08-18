import { expect } from '@playwright/test';

type AssertionFunction = () => void;

export class AssertableResponse<ResponseBody> {
  public raw: Response;
  public body?: ResponseBody | undefined;
  public text?: string | undefined;
  private assertionChain: AssertionFunction[] = [];

  private constructor(raw: Response, body?: ResponseBody, text?: string) {
    this.raw = raw;
    this.body = body;
    this.text = text;
  }

  static async fromResponse<ResponseBody>(response: Response): Promise<AssertableResponse<ResponseBody>> {
    const body = (await response
      .clone()
      .json()
      .catch(() => undefined)) as ResponseBody;
    const text = await response
      .clone()
      .text()
      .catch(() => undefined);

    return new AssertableResponse<ResponseBody>(response, body, text);
  }

  assert(): void {
    if (this.assertionChain.length === 0) {
      return;
    }

    console.log(`Executing assertions against response from "${this.raw.url}"`);

    const failures: string[] = [];

    for (const assertion of this.assertionChain) {
      try {
        assertion();
      } catch (error) {
        failures.push((error as Error).message);
      }
    }

    // Clear the assertion chain after execution
    this.assertionChain = [];

    if (failures.length > 0) {
      const url = this.raw.url;
      const errorMessage = `API response assertions failed for "${url}"\n\t${failures.join('\n\t')}`;
      throw new Error(errorMessage);
    }
  }

  hasAssertions(): boolean {
    return this.assertionChain.length > 0;
  }

  shouldBeOK(): AssertableResponse<ResponseBody> {
    this.assertionChain.push(() => {
      const endpoint = this.getEndpointDescription();
      expect(this.raw.ok, {
        message: `${endpoint} returned HTTP ${this.raw.status} (${this.raw.statusText}) instead of successful status (200-299)`
      }).toBe(true);
      console.log(`✓ ${endpoint} responded successfully`);
    });
    return this;
  }

  shouldHaveStatus(status: number): AssertableResponse<ResponseBody> {
    this.assertionChain.push(() => {
      const endpoint = this.getEndpointDescription();
      expect(this.raw.status, {
        message: `${endpoint} returned HTTP ${this.raw.status} instead of expected HTTP ${status}`
      }).toBe(status);
      console.log(`✓ ${endpoint} returned expected status ${status}`);
    });
    return this;
  }

  shouldHaveText(expectedText: string): AssertableResponse<ResponseBody> {
    this.assertionChain.push(() => {
      const endpoint = this.getEndpointDescription();
      const actualLength = this.text?.length || 0;
      const expectedLength = expectedText.length;
      const preview = this.getTextPreview();
      
      expect(this.text, {
        message: `${endpoint} response text content differs from expected. Got ${actualLength} characters: "${preview}" instead of ${expectedLength} characters: "${this.getTextPreview(expectedText)}"`
      }).toBe(expectedText);
      console.log(`✓ ${endpoint} returned expected text content (${expectedLength} characters)`);
    });
    return this;
  }

  shouldHaveBody(expectedBody: ResponseBody): AssertableResponse<ResponseBody> {
    this.assertionChain.push(() => {
      const endpoint = this.getEndpointDescription();
      const actualBodyString = JSON.stringify(this.body);
      const expectedBodyString = JSON.stringify(expectedBody);
      
      expect(this.body, {
        message: `${endpoint} response body structure differs from expected. Got: ${actualBodyString} instead of: ${expectedBodyString}`
      }).toBe(expectedBody);
      console.log(`✓ ${endpoint} returned expected body structure`);
    });
    return this;
  }

  shouldHaveBodyWithKey(key: string): AssertableResponse<ResponseBody> {
    this.assertionChain.push(() => {
      const endpoint = this.getEndpointDescription();
      
      expect(this.body, {
        message: `${endpoint} response body is undefined or null, cannot verify key "${key}" presence`
      }).not.toBe(undefined);
      
      expect(this.body, {
        message: `${endpoint} response body missing required key "${key}". Available keys: ${this.getAvailableKeys()}`
      }).toHaveProperty(key);
      
      console.log(`✓ ${endpoint} response body contains required key "${key}"`);
    });
    return this;
  }

  shouldHaveBodyWithProperty(key: string, expectedValue: unknown): AssertableResponse<ResponseBody> {
    const body = this.body as Record<string, unknown>;
    this.assertionChain.push(() => {
      const endpoint = this.getEndpointDescription();
      
      expect(body, {
        message: `${endpoint} response body is undefined or null, cannot verify property "${key}"`
      }).not.toBe(undefined);
      
      expect(body, {
        message: `${endpoint} response body missing required property "${key}". Available properties: ${this.getAvailableKeys()}`
      }).toHaveProperty(key);
      
      const actualValue = body[key];
      expect(actualValue, {
        message: `${endpoint} response body property "${key}" has value ${JSON.stringify(actualValue)} instead of expected ${JSON.stringify(expectedValue)}`
      }).toBe(expectedValue);
      
      console.log(`✓ ${endpoint} response body property "${key}" has expected value: ${JSON.stringify(expectedValue)}`);
    });
    return this;
  }

  shouldHaveBodyWithNonNullProperty(key: string): AssertableResponse<ResponseBody> {
    const body = this.body as Record<string, unknown>;
    this.assertionChain.push(() => {
      const endpoint = this.getEndpointDescription();
      
      expect(body, {
        message: `${endpoint} response body is undefined or null, cannot verify property "${key}"`
      }).not.toBe(undefined);
      
      expect(body, {
        message: `${endpoint} response body missing required property "${key}". Available properties: ${this.getAvailableKeys()}`
      }).toHaveProperty(key);
      
      const value = body[key];
      expect(value, {
        message: `${endpoint} response body property "${key}" is null or undefined when non-null value is required`
      }).not.toBe(null);
      
      expect(value, {
        message: `${endpoint} response body property "${key}" is undefined when non-null value is required`
      }).not.toBe(undefined);
      
      console.log(`✓ ${endpoint} response body property "${key}" has non-null value: ${JSON.stringify(value)}`);
    });
    return this;
  }

  // Helper methods for better error messages
  private getEndpointDescription(): string {
      const url = new URL(this.raw.url);
      return `${url.pathname}${url.search}`;
  }

  private getAvailableKeys(): string {
    if (!this.body || typeof this.body !== 'object') {
      return 'none (body is not an object)';
    }
    
    const keys = Object.keys(this.body);
    return keys.length > 0 ? `[${keys.join(', ')}]` : 'none';
  }

  private getTextPreview(text: string = this.text || '', maxLength: number = 100): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }
}