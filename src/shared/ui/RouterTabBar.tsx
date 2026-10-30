import type { BottomTabBarProps } from 'expo-router/tabs';
import type { JSX } from 'react';

import type { IconName } from './Icon';
import { TabBar, type TabBarItem } from './TabBar';

export interface RouterTabBarProps extends BottomTabBarProps {
  /** Feather icon for each route name. */
  icons: Readonly<Record<string, IconName>>;
}

const FALLBACK_ICON: IconName = 'circle';

/** Adapts Expo Router's tab navigator props to the presentational TabBar. */
export function RouterTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  icons,
}: RouterTabBarProps): JSX.Element {
  const items: TabBarItem[] = state.routes.map((route) => ({
    key: route.key,
    label: descriptors[route.key]?.options.title ?? route.name,
    icon: icons[route.name] ?? FALLBACK_ICON,
  }));
  const activeKey = state.routes[state.index]?.key ?? '';

  const handlePress = (routeKey: string): void => {
    // Same contract as the default tab bar, so screens can intercept tabPress.
    const event = emitter.emit({ type: 'tabPress', target: routeKey, canPreventDefault: true });
    if (routeKey !== activeKey && !event.defaultPrevented) navigateToTab(routeKey);
  };

  return <TabBar items={items} activeKey={activeKey} onPress={handlePress} />;
}
