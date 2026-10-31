import { Stack } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import type { JSX } from 'react';
import { Text } from 'react-native';

/**
 * Mirrors src/app's auth guard: the signed-in area is a protected group whose index is "/", so a
 * signed-out start at "/" must fall back to sign-in (E 1.1), never to "Unmatched Route".
 */
function rootLayout(isSignedIn: boolean, authScreens: readonly string[]): () => JSX.Element {
  return function RootLayout(): JSX.Element {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={isSignedIn}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!isSignedIn}>
          {authScreens.map((name) => (
            <Stack.Screen key={name} name={name} />
          ))}
        </Stack.Protected>
      </Stack>
    );
  };
}

function label(text: string): () => JSX.Element {
  return function Label(): JSX.Element {
    return <Text>{text}</Text>;
  };
}

function plainStack(): JSX.Element {
  return <Stack screenOptions={{ headerShown: false }} />;
}

const signedInArea = {
  '(app)/_layout': plainStack,
  '(app)/(tabs)/_layout': plainStack,
  '(app)/(tabs)/index': label('Home'),
};

describe('auth routing', () => {
  it('opens sign-in when a signed-out user starts at "/" (auth screens in the root stack)', async () => {
    await renderRouter(
      {
        _layout: rootLayout(false, ['(auth)/login', '(auth)/forgot-password']),
        ...signedInArea,
        '(auth)/login': label('Welcome back'),
        '(auth)/forgot-password': label('Forgot password?'),
      },
      { initialUrl: '/' },
    );
    expect(screen.getByText('Welcome back')).toBeTruthy();
  });

  it('opens Home for a signed-in user', async () => {
    await renderRouter(
      {
        _layout: rootLayout(true, ['(auth)/login', '(auth)/forgot-password']),
        ...signedInArea,
        '(auth)/login': label('Welcome back'),
        '(auth)/forgot-password': label('Forgot password?'),
      },
      { initialUrl: '/' },
    );
    expect(screen.getByText('Home')).toBeTruthy();
  });
});
