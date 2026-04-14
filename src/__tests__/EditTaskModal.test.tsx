import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditTaskModal } from './EditTaskModal';

const mockTask = {
  id: '1',
  title: 'Existing Task',
  description: 'Existing Description',
  status: 'todo' as const,
  dueDate: '2026-04-22',
  tags: ['test', 'urgent'],
};

const mockOnClose = jest.fn();
const mockOnUpdateTask = jest.fn();
const apiUrl = 'http://localhost:3000';

global.fetch = jest.fn();

beforeEach(() => {
  (global.fetch as jest.Mock).mockClear();
  mockOnClose.mockClear();
  mockOnUpdateTask.mockClear();
});

test('does not render when isOpen is false', () => {
  render(
    <EditTaskModal
      isOpen={false}
      onClose={mockOnClose}
      onUpdateTask={mockOnUpdateTask}
      task={null}
      apiUrl={apiUrl}
    />
  );

  expect(screen.queryByText('Edit Task')).not.toBeInTheDocument();
});

test('does not render when task is null', () => {
  render(
    <EditTaskModal
      isOpen={true}
      onClose={mockOnClose}
      onUpdateTask={mockOnUpdateTask}
      task={null}
      apiUrl={apiUrl}
    />
  );

  expect(screen.queryByText('Edit Task')).not.toBeInTheDocument();
});

test('renders modal with task data when isOpen and task is provided', () => {
  render(
    <EditTaskModal
      isOpen={true}
      onClose={mockOnClose}
      onUpdateTask={mockOnUpdateTask}
      task={mockTask}
      apiUrl={apiUrl}
    />
  );

  expect(screen.getByText('Edit Task')).toBeInTheDocument();
  expect((screen.getByDisplayValue('Existing Task') as HTMLInputElement).value).toBe(
    'Existing Task'
  );
  expect(
    (screen.getByDisplayValue('Existing Description') as HTMLTextAreaElement).value
  ).toBe('Existing Description');
});

test('pre-fills form with task values', async () => {
  render(
    <EditTaskModal
      isOpen={true}
      onClose={mockOnClose}
      onUpdateTask={mockOnUpdateTask}
      task={mockTask}
      apiUrl={apiUrl}
    />
  );

  const titleInput = screen.getByDisplayValue('Existing Task') as HTMLInputElement;
  const descriptionInput = screen.getByDisplayValue('Existing Description') as HTMLTextAreaElement;
  const dueDateInput = screen.getByDisplayValue('2026-04-22') as HTMLInputElement;
  const statusSelect = screen.getByLabelText(/Status/) as HTMLSelectElement;

  expect(titleInput).toBeInTheDocument();
  expect(descriptionInput).toBeInTheDocument();
  expect(dueDateInput).toBeInTheDocument();
  expect(statusSelect.value).toBe('todo');
});

test('closes modal when close button is clicked', async () => {
  render(
    <EditTaskModal
      isOpen={true}
      onClose={mockOnClose}
      onUpdateTask={mockOnUpdateTask}
      task={mockTask}
      apiUrl={apiUrl}
    />
  );

  const closeButton = screen.getByRole('button', { name: '✕' });
  await userEvent.click(closeButton);

  expect(mockOnClose).toHaveBeenCalled();
});

test('shows validation error when title is empty', async () => {
  render(
    <EditTaskModal
      isOpen={true}
      onClose={mockOnClose}
      onUpdateTask={mockOnUpdateTask}
      task={mockTask}
      apiUrl={apiUrl}
    />
  );

  const titleInput = screen.getByDisplayValue('Existing Task') as HTMLInputElement;
  const submitButton = screen.getByRole('button', { name: /Update Task/i });

  await userEvent.clear(titleInput);
  await userEvent.click(submitButton);

  await waitFor(() => {
    expect(screen.getByText('Title is required')).toBeInTheDocument();
  });
});

test('submits updated task data', async () => {
  const updatedTaskResponse = {
    ...mockTask,
    title: 'Updated Task',
    description: 'Updated Description',
    status: 'in-progress' as const,
  };

  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => updatedTaskResponse,
  });

  render(
    <EditTaskModal
      isOpen={true}
      onClose={mockOnClose}
      onUpdateTask={mockOnUpdateTask}
      task={mockTask}
      apiUrl={apiUrl}
    />
  );

  const titleInput = screen.getByDisplayValue('Existing Task') as HTMLInputElement;
  const statusSelect = screen.getByLabelText(/Status/) as HTMLSelectElement;
  const submitButton = screen.getByRole('button', { name: /Update Task/i });

  await userEvent.clear(titleInput);
  await userEvent.type(titleInput, 'Updated Task');
  await userEvent.selectOptions(statusSelect, 'in-progress');
  await userEvent.click(submitButton);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      `${apiUrl}/tasks/${mockTask.id}`,
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(mockOnUpdateTask).toHaveBeenCalledWith(updatedTaskResponse);
    expect(mockOnClose).toHaveBeenCalled();
  });
});

test('handles API error gracefully', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    statusText: 'Bad Request',
  });

  render(
    <EditTaskModal
      isOpen={true}
      onClose={mockOnClose}
      onUpdateTask={mockOnUpdateTask}
      task={mockTask}
      apiUrl={apiUrl}
    />
  );

  const submitButton = screen.getByRole('button', { name: /Update Task/i });
  await userEvent.click(submitButton);

  await waitFor(() => {
    expect(screen.getByText(/Failed to update task/)).toBeInTheDocument();
  });
});

test('submits form with all fields updated', async () => {
  const updatedTaskResponse = {
    ...mockTask,
    title: 'Complete Update',
    description: 'Complete description',
    status: 'done' as const,
    dueDate: '2026-06-01',
    tags: ['completed', 'done'],
  };

  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => updatedTaskResponse,
  });

  render(
    <EditTaskModal
      isOpen={true}
      onClose={mockOnClose}
      onUpdateTask={mockOnUpdateTask}
      task={mockTask}
      apiUrl={apiUrl}
    />
  );

  const titleInput = screen.getByDisplayValue('Existing Task') as HTMLInputElement;
  const descriptionInput = screen.getByDisplayValue('Existing Description') as HTMLTextAreaElement;
  const statusSelect = screen.getByLabelText(/Status/) as HTMLSelectElement;
  const dueDateInput = screen.getByDisplayValue('2026-04-22') as HTMLInputElement;
  const tagsInput = screen.getByDisplayValue('test, urgent') as HTMLInputElement;
  const submitButton = screen.getByRole('button', { name: /Update Task/i });

  await userEvent.clear(titleInput);
  await userEvent.type(titleInput, 'Complete Update');
  await userEvent.clear(descriptionInput);
  await userEvent.type(descriptionInput, 'Complete description');
  await userEvent.selectOptions(statusSelect, 'done');
  await userEvent.clear(dueDateInput);
  await userEvent.type(dueDateInput, '2026-06-01');
  await userEvent.clear(tagsInput);
  await userEvent.type(tagsInput, 'completed, done');
  await userEvent.click(submitButton);

  await waitFor(() => {
    expect(mockOnUpdateTask).toHaveBeenCalledWith(updatedTaskResponse);
  });
});

test('disables form during submission', async () => {
  (global.fetch as jest.Mock).mockImplementation(
    () =>
      new Promise(() => {
        /* never resolves */
      })
  );

  render(
    <EditTaskModal
      isOpen={true}
      onClose={mockOnClose}
      onUpdateTask={mockOnUpdateTask}
      task={mockTask}
      apiUrl={apiUrl}
    />
  );

  const submitButton = screen.getByRole('button', { name: /Update Task/i });
  await userEvent.click(submitButton);

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /Updating.../i })).toBeInTheDocument();
  });
});