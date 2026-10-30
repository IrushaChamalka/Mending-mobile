// Shared Jest setup.
// The safe-area context needs native code; tests get zero insets and the 390 × 844 design frame.
jest.mock('react-native-safe-area-context', () => {
  const packageMock = jest.requireActual<{ default: Record<string, unknown> }>(
    'react-native-safe-area-context/jest/mock',
  );
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  return {
    ...packageMock.default,
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
  };
});

// Vector-icon fonts are bundled natively; in Jest, report them as loaded so Icon never touches expo-asset.
jest.mock('expo-font', () => {
  const actual = jest.requireActual<typeof import('expo-font')>('expo-font');
  return {
    ...actual,
    isLoaded: () => true,
    loadAsync: () => Promise.resolve(),
  };
});

// react-native-mmkv swaps in its own in-memory store under Jest, but importing it still loads Nitro,
// whose native module does not exist here. Nothing calls Nitro in tests, so an inert stub is enough.
jest.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: () => {
      throw new Error('Nitro modules are not available in tests.');
    },
  },
}));

// Node 25 exposes an experimental localStorage that prints a warning on first read. zustand's persist
// reads it while building its default storage, even though the app passes MMKV. React Native has no
// localStorage, so tests hide it too.
Object.defineProperty(globalThis, 'localStorage', { value: undefined, configurable: true });
