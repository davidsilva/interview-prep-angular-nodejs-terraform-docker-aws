import LocalStorageMock from './local-storage-mock';

describe('LocalStorageMock', () => {
  let localStorageMock: LocalStorageMock;

  beforeEach(() => {
    localStorageMock = new LocalStorageMock();
  });

  it('should initialize with an empty store', () => {
    expect(localStorageMock.length).toBe(0);
  });

  it('should store and retrieve an item', () => {
    localStorageMock.setItem('key', 'value');
    expect(localStorageMock.getItem('key')).toBe('value');
  });

  it('should return null for a non-existent key', () => {
    expect(localStorageMock.getItem('nonExistentKey')).toBeNull();
  });

  it('should remove an item', () => {
    localStorageMock.setItem('key', 'value');
    localStorageMock.removeItem('key');
    expect(localStorageMock.getItem('key')).toBeNull();
    expect(localStorageMock.length).toBe(0);
  });

  it('should clear all items', () => {
    localStorageMock.setItem('key1', 'value1');
    localStorageMock.setItem('key2', 'value2');
    localStorageMock.clear();
    expect(localStorageMock.getItem('key1')).toBeNull();
    expect(localStorageMock.getItem('key2')).toBeNull();
    expect(localStorageMock.length).toBe(0);
  });

  it('should return the correct length', () => {
    expect(localStorageMock.length).toBe(0);
    localStorageMock.setItem('key1', 'value1');
    localStorageMock.setItem('key2', 'value2');
    expect(localStorageMock.length).toBe(2);
  });

  it('should return the correct key by index', () => {
    localStorageMock.setItem('key1', 'value1');
    localStorageMock.setItem('key2', 'value2');
    expect(localStorageMock.key(0)).toBe('key1');
    expect(localStorageMock.key(1)).toBe('key2');
    expect(localStorageMock.key(2)).toBeNull();
  });

  it('should overwrite an existing key', () => {
    localStorageMock.setItem('key', 'value1');
    localStorageMock.setItem('key', 'value2');
    expect(localStorageMock.getItem('key')).toBe('value2');
    expect(localStorageMock.length).toBe(1);
  });
});
