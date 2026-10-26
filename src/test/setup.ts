import '@testing-library/jest-dom';

// Polyfill window.matchMedia if needed in jsdom
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Default admin session for existing test suites
if (typeof window !== 'undefined' && window.sessionStorage) {
  window.sessionStorage.setItem('admin_authenticated', 'true');
}

// Polyfill window.confirm if not present in jsdom
if (typeof window !== 'undefined' && typeof window.confirm !== 'function') {
  window.confirm = () => true;
}
