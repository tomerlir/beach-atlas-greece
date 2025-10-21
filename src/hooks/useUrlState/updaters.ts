/**
 * Builder pattern for updating URL search parameters
 */
export class URLParamsBuilder {
  constructor(private params: URLSearchParams) {}

  /**
   * Set a string parameter (removes if undefined or empty)
   */
  setString(key: string, value: string | undefined): this {
    if (value) {
      this.params.set(key, value);
    } else {
      this.params.delete(key);
    }
    return this;
  }

  /**
   * Set an array parameter (comma-separated, removes if empty)
   */
  setArray(key: string, value: string[]): this {
    if (value.length > 0) {
      this.params.set(key, value.join(","));
    } else {
      this.params.delete(key);
    }
    return this;
  }

  /**
   * Set a boolean parameter (removes if false)
   */
  setBoolean(key: string, value: boolean): this {
    if (value) {
      this.params.set(key, "true");
    } else {
      this.params.delete(key);
    }
    return this;
  }

  /**
   * Set an integer parameter (removes if 1 or less)
   */
  setInteger(key: string, value: number, minValue: number = 1): this {
    if (value > minValue) {
      this.params.set(key, value.toString());
    } else {
      this.params.delete(key);
    }
    return this;
  }

  /**
   * Set a sort parameter with default handling
   */
  setSort(key: string, value: string | null, defaultValue: string): this {
    if (value === null) {
      // Explicitly turned off - remove from URL
      this.params.delete(key);
    } else if (value !== defaultValue) {
      // Not the default - add to URL
      this.params.set(key, value);
    } else {
      // Set to default - remove from URL to keep it clean
      this.params.delete(key);
    }
    return this;
  }

  /**
   * Build the final URLSearchParams
   */
  build(): URLSearchParams {
    return this.params;
  }
}

/**
 * Create a new URLParamsBuilder instance
 */
export function createURLParamsBuilder(prevParams: URLSearchParams): URLParamsBuilder {
  return new URLParamsBuilder(new URLSearchParams(prevParams));
}
