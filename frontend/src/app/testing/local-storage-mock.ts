class LocalStorageMock {
  private store: Record<string, string>;

  constructor() {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  get length(): number {
    return Object.keys(this.store).length;
  }
}

// Save a reference to the original localStorage
let originalLocalStorage: Storage | undefined;

/**
 * Mock the global localStorage object with LocalStorageMock.
 */
export function mockLocalStorage(): void {
  if (!originalLocalStorage) {
    // Save the original localStorage reference
    originalLocalStorage = window.localStorage;
  }

  // Replace the global localStorage with the mock
  const mock = new LocalStorageMock();
  Object.defineProperty(window, 'localStorage', {
    value: mock,
    writable: true,
  });
}

/**
 * Restore the original global localStorage object.
 */
export function unmockLocalStorage(): void {
  if (originalLocalStorage) {
    // Restore the original localStorage reference
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
    originalLocalStorage = undefined; // Clear the reference
  }
}

export default LocalStorageMock;
