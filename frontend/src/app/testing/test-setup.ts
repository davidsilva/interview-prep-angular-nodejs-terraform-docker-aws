import LocalStorageMock from './local-storage-mock';

// Assign the mock to the global object (Node.js or browser)
if (
  typeof global !== 'undefined' &&
  typeof global.localStorage === 'undefined'
) {
  (global as any).localStorage = new LocalStorageMock();
}

if (
  typeof window !== 'undefined' &&
  typeof window.localStorage === 'undefined'
) {
  (window as any).localStorage = new LocalStorageMock();
}

if (
  typeof globalThis !== 'undefined' &&
  typeof globalThis.localStorage === 'undefined'
) {
  (globalThis as any).localStorage = new LocalStorageMock();
}
