import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const mockTasks = {
  data: [
    {
      id: '1',
      title: 'Test Task 1',
      description: 'Test description 1',
      status: 'todo',
      dueDate: '2026-04-22',
      tags: ['test'],
      createdAt: '2026-04-14T18:48:33.573Z',
      updatedAt: '2026-04-14T18:48:33.573Z',
    },
    {
      id: '2',
      title: 'Test Task 2',
      description: 'Test description 2',
      status: 'in-progress',
      dueDate: '2026-04-30',
      tags: ['urgent'],
      createdAt: '2026-04-14T18:49:03.620Z',
      updatedAt: '2026-04-14T18:49:03.620Z',
    },
  ],
  nextCursor: null,
};

global.fetch = jest.fn();

beforeEach(() => {
  (global.fetch as jest.Mock).mockClear();
});

test('renders app with title and loading state', () => {
  (global.fetch as jest.Mock).mockImplementation(
    () =>
      new Promise(() => {
        /* never resolves to keep loading state */
      })
  );

  render(<App />);
  expect(screen.getByText('Tasks')).toBeInTheDocument();
  expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
});

test('renders tasks after fetching', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => mockTasks,
  });

  render(<App />);

  await waitFor(() => {
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
  });
});

test('displays task details correctly', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => mockTasks,
  });

  render(<App />);

  await waitFor(() => {
    expect(screen.getByText('Test description 1')).toBeInTheDocument();
    expect(screen.getByText(/2026-04-22/)).toBeInTheDocument();
  });
});

test('shows error message on fetch failure', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    statusText: 'Server Error',
  });

  render(<App />);

  await waitFor(() => {
    expect(screen.getByText(/Error:/)).toBeInTheDocument();
  });
});

test('opens create task modal when button is clicked', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => mockTasks,
  });

  render(<App />);

  const createButton = screen.getByText('+ New Task');
  await userEvent.click(createButton);

  await waitFor(() => {
    expect(screen.getByText('Create New Task')).toBeInTheDocument();
  });
});

test('deletes task when delete button is clicked', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => mockTasks,
  });

  render(<App />);

  await waitFor(() => {
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
  });

  window.confirm = jest.fn(() => true);

  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
  });

  const deleteButtons = screen.getAllByTitle('Delete task');
  await userEvent.click(deleteButtons[0]);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/tasks/1',
      { method: 'DELETE' }
    );
  });
});

test('opens edit task modal when task is clicked', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => mockTasks,
  });

  render(<App />);

  await waitFor(() => {
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
  });

  const taskItem = screen.getByText('Test Task 1').closest('li');
  if (taskItem) {
    await userEvent.click(taskItem);
  }

  await waitFor(() => {
    expect(screen.getByText('Edit Task')).toBeInTheDocument();
  });
});

test('displays no tasks message when list is empty', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: [], nextCursor: null }),
  });

  render(<App />);

  await waitFor(() => {
    expect(screen.getByText('No tasks found')).toBeInTheDocument();
  });
});
