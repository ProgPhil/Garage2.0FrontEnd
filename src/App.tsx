import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { CreateTaskModal } from './CreateTaskModal';
import { EditTaskModal } from './EditTaskModal';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  dueDate?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/tasks`);
        if (!response.ok) {
          throw new Error(`Failed to fetch tasks: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('API Response:', data);
        // Extract tasks from backend response
        const taskList = data.data || (Array.isArray(data) ? data : []);
        setTasks(taskList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleCreateTask = (newTask: Task) => {
    setTasks([...tasks, newTask]);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.statusText}`);
      }

      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      alert(`Error deleting task: ${errorMsg}`);
      console.error('Error deleting task:', err);
    }
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map(task => (task.id === updatedTask.id ? updatedTask : task)));
    setEditingTask(null);
  };

  return (
    <div className="App">
      <img src={logo} className="App-logo" alt="logo" />
      <h1>Tasks</h1>
      <button className="btn-create" onClick={() => setIsModalOpen(true)}>
        + New Task
      </button>

      {loading && <p>Loading tasks...</p>}
      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && (
        <div>
          {tasks.length === 0 ? (
            <p>No tasks found</p>
          ) : (
            <ul>
              {tasks.map(task => (
                <li key={task.id} onClick={() => setEditingTask(task)} className="task-item">
                  <div className="task-header">
                    <strong>{task.title}</strong>
                    <button
                      className="btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                      }}
                      title="Delete task"
                    >
                      🗑️
                    </button>
                  </div>
                  {task.description && <p>{task.description}</p>}
                  <div className="task-meta">
                    {task.dueDate && <span className="due-date">📅 {task.dueDate}</span>}
                    <span className={`status status-${task.status}`}>
                      {task.status === 'todo' && '○ To Do'}
                      {task.status === 'in-progress' && '⏳ In Progress'}
                      {task.status === 'done' && '✓ Done'}
                    </span>
                  </div>
                  {task.tags && task.tags.length > 0 && (
                    <div className="tags">
                      {task.tags.map((tag, idx) => (
                        <span key={idx} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateTask={handleCreateTask}
        apiUrl={process.env.REACT_APP_API_URL || 'http://localhost:3000'}
      />

      <EditTaskModal
        isOpen={editingTask !== null}
        onClose={() => setEditingTask(null)}
        onUpdateTask={handleUpdateTask}
        task={editingTask}
        apiUrl={process.env.REACT_APP_API_URL || 'http://localhost:3000'}
      />
    </div>
  );
}

export default App;
