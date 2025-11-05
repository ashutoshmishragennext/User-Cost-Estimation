'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus, ChevronRight, Calendar, X, Loader2, CheckCircle2, Clock, Edit2,
  Trash2, Save
} from 'lucide-react';

// ==================== TYPES ====================
interface Project {
  id: string;
  projectName: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
interface Task {
  taskId: string;
  taskName: string;
  description: string | null;
  expectedHours: string;
  actualHours: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt: string | null;
  createdAt: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;

}
interface EmployeeSummary {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  totalTasks: number;
  totalExpectedHours: number;
  totalActualHours: number;
  pendingTasks: number;
  approvedTasks: number;
  rejectedTasks: number;
}

interface ProjectDetails {
  project: Project;
  tasks: Task[];
  summary: {
    totalTasks: number;
    totalExpectedHours: string;
    totalActualHours: string;
    variance: string;
    variancePercentage: string;
  };
  employees: EmployeeSummary[];
}
interface TaskFormData {
  taskName: string;
  description: string;
  expectedHours: string;
  actualHours: string;
}
interface TaskFormErrors {
  taskName?: string;
  description?: string;
  expectedHours?: string;
  actualHours?: string;
  submit?: string;
}

// ==================== ADD/EDIT TASK MODAL ====================
const TaskModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
}> = ({ isOpen, onClose, onSuccess, projectId }) => {
  const [formData, setFormData] = useState<TaskFormData>({
    taskName: '',
    description: '',
    expectedHours: '',
    actualHours: '',
  });
  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ taskName: '', description: '', expectedHours: '', actualHours: '' });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: TaskFormErrors = {};
    if (!formData.taskName.trim()) newErrors.taskName = 'Task name is required';
    else if (formData.taskName.trim().length < 3) newErrors.taskName = 'Task name must be at least 3 characters';
    else if (formData.taskName.trim().length > 255) newErrors.taskName = 'Task name must be less than 255 characters';

    if (formData.description.length > 1000) newErrors.description = 'Description must be less than 1000 characters';

    const expectedHours = parseFloat(formData.expectedHours);
    if (!formData.expectedHours || isNaN(expectedHours) || expectedHours <= 0) newErrors.expectedHours = 'Expected hours must be greater than 0';

    const actualHours = parseFloat(formData.actualHours);
    if (!formData.actualHours || isNaN(actualHours) || actualHours <= 0) newErrors.actualHours = 'Actual hours must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof TaskFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});
    try {
      const response = await fetch(`/api/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          taskName: formData.taskName.trim(),
          description: formData.description.trim() || null,
          expectedHours: parseFloat(formData.expectedHours),
          actualHours: parseFloat(formData.actualHours),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create task');

      setFormData({ taskName: '', description: '', expectedHours: '', actualHours: '' });
      onSuccess();
      onClose();
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to create task' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-xl font-semibold">Add New Task</h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label htmlFor="taskName" className="block mb-1 font-medium text-gray-700">
              Task Name <span className="text-red-600">*</span>
            </label>
            <input
              id="taskName"
              type="text"
              value={formData.taskName}
              onChange={(e) => handleChange('taskName', e.target.value)}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                errors.taskName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Enter task name"
            />
            {errors.taskName && <p className="text-red-600 text-sm mt-1">{errors.taskName}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block mb-1 font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Enter task description (optional)"
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
          </div>

          <div>
            <label htmlFor="expectedHours" className="block mb-1 font-medium text-gray-700">
              Expected Hours <span className="text-red-600">*</span>
            </label>
            <input
              id="expectedHours"
              type="number"
              step="0.5"
              min="0"
              value={formData.expectedHours}
              onChange={(e) => handleChange('expectedHours', e.target.value)}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                errors.expectedHours ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Enter expected hours"
            />
            {errors.expectedHours && <p className="text-red-600 text-sm mt-1">{errors.expectedHours}</p>}
          </div>

          <div>
            <label htmlFor="actualHours" className="block mb-1 font-medium text-gray-700">
              Actual Hours <span className="text-red-600">*</span>
            </label>
            <input
              id="actualHours"
              type="number"
              step="0.5"
              min="0"
              value={formData.actualHours}
              onChange={(e) => handleChange('actualHours', e.target.value)}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                errors.actualHours ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Enter actual hours"
            />
            {errors.actualHours && <p className="text-red-600 text-sm mt-1">{errors.actualHours}</p>}
          </div>

          {errors.submit && (
            <p className="bg-red-50 border border-red-400 text-red-700 px-4 py-2 rounded">{errors.submit}</p>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== PROJECT CARD ====================
const ProjectCard: React.FC<{
  project: Project;
  onClick: () => void;
}> = ({ project, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer hover:border-blue-400"
  >
    <div className="flex justify-between items-start mb-3">
      <h3 className="text-xl font-semibold text-gray-900">{project.projectName}</h3>
      <ChevronRight className="text-gray-400 w-5 h-5 flex-shrink-0" />
    </div>
    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
      {project.description || 'No description provided'}
    </p>
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-1 text-gray-500">
        <Calendar className="w-4 h-4" />
        {new Date(project.createdAt).toLocaleDateString('en-IN')}
      </span>
    </div>
  </div>
);

// ==================== PROJECT TASKS VIEW ====================
const ProjectTasksView: React.FC<{
  projectDetails: ProjectDetails;
  currentUserId: string;
  onBack: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}> = ({ projectDetails, currentUserId, onBack, onRefresh, isLoading }) => {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { project, tasks, summary } = projectDetails;
  const myTasks = tasks.filter(t => t.employeeId === currentUserId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };
  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };
  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };
  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${taskToDelete.taskId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete task');
      }
      setShowDeleteModal(false);
      setTaskToDelete(null);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };
  const handleModalClose = () => {
    setShowTaskModal(false);
    setEditingTask(null);
  };
  const handleTaskSuccess = () => {
    onRefresh();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center gap-2">
          ← Back to Projects
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{project.projectName}</h2>
            <p className="text-gray-500 mt-1">{project.description || 'No description'}</p>
          </div>
          <button
            onClick={() => setShowTaskModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">My Tasks</p>
          <p className="text-3xl font-bold text-gray-900">{myTasks.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Expected Hours</p>
          <p className="text-3xl font-bold text-blue-600">
            {myTasks.reduce((sum, t) => sum + parseFloat(t.expectedHours), 0).toFixed(1)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Actual Hours</p>
          <p className="text-3xl font-bold text-purple-600">
            {myTasks.reduce((sum, t) => sum + parseFloat(t.actualHours), 0).toFixed(1)}
          </p>
        </div>
      </div>
      {/* My Tasks Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Tasks</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Task</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Expected</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actual</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.taskId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{task.employeeName}</p>
                      <p className="text-sm text-gray-500">{task.employeeEmail}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{task.taskName}</p>
                  </td>
                  <td className="px-6 py-4 max-w-md">
                    <p className="text-sm text-gray-700">{task.description || 'No description'}</p>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {parseFloat(task.expectedHours).toFixed(1)}h
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {parseFloat(task.actualHours).toFixed(1)}h
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {getStatusIcon(task.status)}
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(task.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No tasks yet for this project.</p>
            </div>
          )}
        </div>
      </div>
      <TaskModal
        isOpen={showTaskModal}
        onClose={handleModalClose}
        onSuccess={handleTaskSuccess}
        projectId={project.id}
        // editTask={editingTask}
      />
 
    </div>
  );
};

// ==================== MAIN USER DASHBOARD ====================
export default function UserDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    fetchCurrentUser();
    fetchProjects();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      setCurrentUserId(data.user?.id || '');
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch projects');
      }
      setProjects(data.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  };

  // const fetchProjectDetails = async (projectId: string) => {
  //   setIsLoadingDetails(true);
  //   try {
  //     const response = await fetch(`/api/projects/${projectId}`);
  //     const data = await response.json();
  //     if (!response.ok) {
  //       throw new Error(data.error || 'Failed to fetch project details');
  //     }
  //     setProjectDetails(data);
  //   } catch (err) {
  //     setProjectDetails(null);
  //   } finally {
  //     setIsLoadingDetails(false);
  //   }
  // };

    const fetchProjectDetails = async (projectId: string) => {
    setIsLoadingDetails(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch project details');
      }

      setProjectDetails(data);
    } catch (err) {
      console.error('Error fetching project details:', err);
      setProjectDetails(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProjectId(project.id);
    fetchProjectDetails(project.id);
  };
  const handleBack = () => {
    setSelectedProjectId(null);
    setProjectDetails(null);
  };
  const handleRefresh = () => {
    if (selectedProjectId) {
      fetchProjectDetails(selectedProjectId);
    }
  };

  if (selectedProjectId && projectDetails && currentUserId) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <ProjectTasksView
            projectDetails={projectDetails}
            currentUserId={currentUserId}
            onBack={handleBack}
            onRefresh={handleRefresh}
            isLoading={isLoadingDetails}
          />
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-600 mt-2">Select a project to manage your tasks</p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleProjectClick(project)}
              />
            ))}
          </div>
        )}
        {!isLoading && projects.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No projects available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
