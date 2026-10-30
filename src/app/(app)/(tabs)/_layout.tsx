import { Tabs } from 'expo-router';
import type { JSX } from 'react';

import { RouterTabBar, type IconName } from '@/shared/ui';

const TAB_ICONS: Readonly<Record<string, IconName>> = {
  index: 'home',
  tasks: 'list-checks',
  earnings: 'banknote',
  withdraw: 'wallet',
  profile: 'user',
};

/** The five tabs of the employee designs (E 2.1 bottom bar). */
export default function TabsLayout(): JSX.Element {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <RouterTabBar {...props} icons={TAB_ICONS} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tasks' }} />
      <Tabs.Screen name="earnings" options={{ title: 'Earnings' }} />
      <Tabs.Screen name="withdraw" options={{ title: 'Withdraw' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
