import { focusManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

import { todayCalendarDate, type CalendarDate } from '@/shared/utils/date';

function subscribeToAppFocus(onChange: () => void): () => void {
  return focusManager.subscribe(onChange);
}

/** Today's local calendar date, re-checked whenever the app returns to the foreground. */
export function useToday(): CalendarDate {
  return useSyncExternalStore(subscribeToAppFocus, todayCalendarDate, todayCalendarDate);
}
