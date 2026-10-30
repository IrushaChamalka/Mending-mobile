import { makeTask } from '../../__fixtures__/taskFixtures';
import { flattenTaskPages, updateTaskInPages, type TaskListData } from '../taskCache';

function listOf(...pages: ReturnType<typeof makeTask>[][]): TaskListData {
  return {
    pages: pages.map((tasks) => ({ tasks, nextPage: null })),
    pageParams: pages.map((_page, index) => index + 1),
  };
}

describe('task cache helpers', () => {
  it('flattens every page in order', () => {
    const data = listOf([makeTask({ id: 'a' })], [makeTask({ id: 'b' })]);
    expect(flattenTaskPages(data).map((task) => task.id)).toEqual(['a', 'b']);
    expect(flattenTaskPages(undefined)).toEqual([]);
  });

  it('updates one task and keeps untouched pages and tasks by reference', () => {
    const untouched = makeTask({ id: 'b' });
    const data = listOf([makeTask({ id: 'a' }), untouched], [makeTask({ id: 'c' })]);
    const updated = updateTaskInPages(data, 'a', (task) => ({ ...task, status: 'ACCEPTED' }));

    expect(updated.pages[0]?.tasks[0]?.status).toBe('ACCEPTED');
    expect(updated.pages[0]?.tasks[1]).toBe(untouched);
    expect(updated.pages[1]).toBe(data.pages[1]);
  });
});
