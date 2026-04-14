import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateTaskModal } from './CreateTaskModal';

const mockOnClose = jest.fn();
const mockOnCreateTask = jest.fn();
const apiUrl = 'http://localhost:3000';

global.fetch = jest.fn();

beforeEach(() => {
  (global.fetch as jest.Mock).mockClear();
  mockOnClose.mockClear();
  mockOnCreateTask.mockClear();
});

test('does not render when isOpen is false', () => {
  render(
    <CreateTaskModal
      isOpen={false}
      onClose={mockOnClose}
      onCreateTask={mockOnCreateTask}
      apiUrl={apiUrl}
    />
  );

  expect(screen.queryByText('Create New Task')).not.toBeInTheDocument();
});

test('renders modal when isOpen is true', () => {
  render(
    <CreateTaskModal
      isOpen={true}
      onClose={mockOnClose}
      onCreateTask={mockOnCreateTask}
      apiUrl={apiUrl}
    />
  );

  expect(screen.getByText('Create New Task')).toBeInTheDocument();
  expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
});

test('closes modal when close button is clicked', async () => {
  render(
    <CreateTaskModal
      isOpen={true}
      onClose={mockOnClose}
      onCreateTask={mockOnCreateTask}
      apiUrl={apiUrl}
    />
  );

  const closeButton = screen.getByRole('button', { name: '✕' });
  await userEvent.click(closeButton);

  expect(mockOnClose).toHaveBeenCalled();
});

test('shows validation error when title is empty', async () => {
  render(
    <CreateTaskModal
      isOpen={true}
      onClose={mockOnClose}
      onCreateTask={mockOnCreateTask}
      apiUrl={apiUrl}
    />
  );

  const submitButton = screen.getByRole('button', { name: /Create Task/i });
  await userEvent.click(submitButton);

  await waitFor(() => {
    expect(screen.getByText('Title is required')).toBeInTheDocument();
  });
});

test('submits form with valid data', async () => {
  const mockResponse = {
    id: '123',
    title: 'New Task',
    description: 'New Description',
    status: 'todo',
    dueDate: '2026-05-01',
    tags: ['test'],
  };

  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => mockResponse,
  });

  render(
    <CreateTaskModal
      isOpen={true}
      onClose={mockOnClose}
      onCreateTask={mockOnCreateTask}
      apiUrl={apiUrl}
    />
  );

  const titleInput = screen.getByPlaceholderText('Task title');
  const descriptionInput = screen.getByPlaceholderText('Task description');
  const submitButton = screen.getByRole('button', { name: /Create Task/i });

  await userEvent.type(titleInput, 'New Task');
  await userEvent.type(descriptionInput, 'New Description');
  await userEvent.click(submitButton);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      `${apiUrl}/tasks`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(mockOnCreateTask).toHaveBeenCalledWith(mockResponse);
  });
});

test('handles API error gracefully', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    statusText: 'Bad Request',
  });

  render(
    <CreateTaskModal
      isOpen={true}
      onClose={mockOnClose}
      onCreateTask={mockOnCreateTask}
      apiUrl={apiUrl}
    />
  );

  const titleInput = screen.getByPlaceholderText('Task title');
  const submitButton = screen.getByRole('button', { name: /Create Task/i });

  await userEvent.type(titleInput, 'Test Task');
  await userEvent.click(submitButton);

  await waitFor(() => {
    expect(screen.getByText(/Failed to create task/)).toBeInTheDocument();
  });
});

test('submits form with all fields', async () => {
  const mockResponse = {
    id: '123',
    title: 'Complete Task',
    description: 'Full description',
    status: 'in-progress',
    dueDate: '2026-05-15',
    tags: ['urgent', 'work'],
  };

  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => mockResponse,
  });

  render(
    <CreateTaskModal
      isOpen={true}
      onClose={mockOnClose}
      onCreateTask={mockOnCreateTask}
      apiUrl={apiUrl}
    />
  );

  const titleInput = screen.getByPlaceholderText('Task title');
  const descriptionInput = screen.getByPlaceholderText('Task description');
  const statusSelect = screen.getByLabelText(/Status/) as HTMLSelectElement;
  const dueDateInput = screen.getByLabelText(/Due Date/);
  const tagsInput = screen.getByPlaceholderText(/e\.g\. urgent/);
  const submitButton = screen.getByRole('button', { name: /Create Task/i });

  await userEvent.type(titleInput, 'Complete Task');
  await userEvent.type(descriptionInput, 'Full description');
  await userEvent.selectOptions(statusSelect, 'in-progress');
  await userEvent.type(dueDateInput, '2026-05-15');
  await userEvent.type(tagsInput, 'urgent, work');
  await userEvent.click(submitButton);

  await waitFor(() => {
    expect(mockOnCreateTask).toHaveBeenCalledWith(mockResponse);
    expect(mockOnClose).toHaveBeenCalled();
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
    <CreateTaskModal
      isOpen={true}
      onClose={mockOnClose}
      onCreateTask={mockOnCreateTask}
      apiUrl={apiUrl}
    />
  );

  const titleInput = screen.getByPlaceholderText('Task title');
  const submitButton = screen.getByRole('button', { name: /Create Task/i });

  await userEvent.type(titleInput, 'Test Task');
  await userEvent.click(submitButton);

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /Creating.../i })).toBeInTheDocument();
  });
});