'use client';

import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, Calendar, X, Loader2, CheckCircle2, Clock, Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { downloadCSV, formatProjectDetailsForExport, formatProjectsForExport } from '@/utils/exportUtils';
import DownloadButton from '@/components/DownloadButton';
import SearchBox from '@/components/SearchBox';

// ==================== TYPES ====================
interface Project {
  id: string;
  projectName: string;
  description: string | null;
  createdBy: string;
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

interface FormData {
  projectName: string;
  description: string;
}

interface FormErrors {
  projectName?: string;
  description?: string;
  submit?: string;
}

// ==================== ADD PROJECT MODAL ====================
const AddProjectModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    projectName: '',
    description: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.projectName.trim()) {
      newErrors.projectName = 'Project name is required';
    } else if (formData.projectName.trim().length < 3) {
      newErrors.projectName = 'Project name must be at least 3 characters';
    } else if (formData.projectName.trim().length > 255) {
      newErrors.projectName = 'Project name must be less than 255 characters';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: formData.projectName.trim(),
          description: formData.description.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      setFormData({ projectName: '', description: '' });
      onSuccess();
      onClose();
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create project',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      navbar
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Add New Project</h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="projectName"
              value={formData.projectName}
              onChange={(e) => handleChange('projectName', e.target.value)}
              disabled={isSubmitting}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.projectName ? 'border-red-500' : 'border-gray-300'
                } ${isSubmitting ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              placeholder="Enter project name"
            />
            {errors.projectName && (
              <p className="mt-1 text-sm text-red-600">{errors.projectName}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={isSubmitting}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${errors.description ? 'border-red-500' : 'border-gray-300'
                } ${isSubmitting ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              placeholder="Enter project description (optional)"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== DELETE CONFIRMATION MODAL ====================
const DeleteConfirmModal: React.FC<{
  isOpen: boolean;
  projectName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}> = ({ isOpen, projectName, onConfirm, onCancel, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Project</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete <span className="font-semibold">{projectName}</span>? This action will soft delete the project.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== PROJECT CARD ====================
const ProjectCard: React.FC<{
  project: Project;
  onClick: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}> = ({ project, onClick, onDelete, isAdmin }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all group">
    <div className="flex justify-between items-start mb-3">
      <div onClick={onClick} className="flex-1 cursor-pointer">
        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {project.projectName}
        </h3>
      </div>
      <div className="flex items-center gap-2">
        {isAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-500 hover:text-red-700 transition-colors p-1"
            title="Delete project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <ChevronRight className="text-gray-400 w-5 h-5 flex-shrink-0" />
      </div>
    </div>
    <div onClick={onClick} className="cursor-pointer">
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
  </div>
);

// ==================== PROJECT DETAIL VIEW ====================
const ProjectDetailView: React.FC<{
  projectDetails: ProjectDetails;
  onBack: () => void;
  isLoading: boolean;
  onExport?: () => void; // Add this
  isExporting?: boolean; // Add this
}> = ({ projectDetails, onBack, isLoading, onExport, isExporting }) => {
  const { project, tasks, summary, employees } = projectDetails;


const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
const [editedTaskName, setEditedTaskName] = useState('');
const [editedActualHours, setEditedActualHours] = useState('');
const [isSaving, setIsSaving] = useState(false);

  // Add search states
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(tasks);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeSummary[]>(employees);

  // Filter tasks based on search
  useEffect(() => {
    if (taskSearchTerm) {
      const filtered = tasks.filter(task =>
        task.taskName.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
        task.employeeName.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
        task.employeeEmail.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(taskSearchTerm.toLowerCase())) ||
        task.status.toLowerCase().includes(taskSearchTerm.toLowerCase())
      );
      setFilteredTasks(filtered);
    } else {
      setFilteredTasks(tasks);
    }
  }, [taskSearchTerm, tasks]);

  // Filter employees based on search
  useEffect(() => {
    if (employeeSearchTerm) {
      const filtered = employees.filter(employee =>
        employee.employeeName.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
        employee.employeeEmail.toLowerCase().includes(employeeSearchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [employeeSearchTerm, employees]);
const handleEditClick = (task: Task) => {
  setEditingTaskId(task.taskId);
  setEditedTaskName(task.taskName);
  setEditedActualHours(task.actualHours);
};

const handleCancelEdit = () => {
  setEditingTaskId(null);
  setEditedTaskName('');
  setEditedActualHours('');
};

const handleSaveEdit = async (taskId: string) => {
  setIsSaving(true);
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskName: editedTaskName.trim(),
        actualHours: parseFloat(editedActualHours),
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to update task');
    }

    // Refresh the project details after successful update
    window.location.reload();
  } catch (error) {
    console.error('Error updating task:', error);
    alert(error instanceof Error ? error.message : 'Failed to update task');
  } finally {
    setIsSaving(false);
  }
};
  const varianceNum = parseFloat(summary.variance);
  const isOverBudget = varianceNum > 0;
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
          className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center gap-2"
        >
          ← Back to Projects
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex-1 max-w-md">
            <SearchBox
              value={taskSearchTerm}
              onChange={setTaskSearchTerm}
              placeholder="Search tasks, employees, or status..."
              className="w-full"
            />
          </div>
          <DownloadButton
            onDownload={onExport || (() => { })}
            isLoading={isExporting}
            disabled={tasks.length === 0}
            variant="outline"
          >
            Export Project Data
          </DownloadButton>
        </div>

        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{project.projectName}</h2>
            <p className="text-gray-500 mt-1">{project.description || 'No description'}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Tasks</p>
          <p className="text-3xl font-bold text-gray-900">{summary.totalTasks}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Expected Hours</p>
          <p className="text-3xl font-bold text-blue-600">{parseFloat(summary.totalExpectedHours).toFixed(1)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Actual Hours</p>
          <p className="text-3xl font-bold text-purple-600">{parseFloat(summary.totalActualHours).toFixed(1)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Variance</p>
          <div className="flex items-center gap-2">
            <p className={`text-3xl font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
              {isOverBudget ? '+' : ''}{parseFloat(summary.variance).toFixed(1)}
            </p>
            {isOverBudget ? <TrendingUp className="w-5 h-5 text-red-600" /> : <TrendingDown className="w-5 h-5 text-green-600" />}
          </div>
          <p className={`text-xs mt-1 ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
            {summary.variancePercentage}%
          </p>
        </div>
      </div>

      {/* Employee Summary */}
      {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Employee Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Total Tasks</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Expected</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actual</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Approved</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Pending</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Rejected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map((emp) => (
                <tr key={emp.employeeId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{emp.employeeName}</p>
                      <p className="text-sm text-gray-500">{emp.employeeEmail}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{emp.totalTasks}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{emp.totalExpectedHours.toFixed(1)}h</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{emp.totalActualHours.toFixed(1)}h</td>
                  <td className="px-6 py-4">
                    <span className="text-green-600 font-semibold">{emp.approvedTasks}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-yellow-600 font-semibold">{emp.pendingTasks}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-red-600 font-semibold">{emp.rejectedTasks}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div> */}

      {/* Task Details */}
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>

              </tr>
            </thead>
            {/* <tbody className="divide-y divide-gray-200">
              {filteredTasks.map((task) => (
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
            </tbody> */}
        <tbody className="divide-y divide-gray-200">
  {filteredTasks.map((task) => (
    <tr key={task.taskId} className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-gray-900">{task.employeeName}</p>
          <p className="text-sm text-gray-500">{task.employeeEmail}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        {editingTaskId === task.taskId ? (
          <input
            type="text"
            value={editedTaskName}
            onChange={(e) => setEditedTaskName(e.target.value)}
            className="w-full px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSaving}
          />
        ) : (
          <p className="font-medium text-gray-900">{task.taskName}</p>
        )}
      </td>
      <td className="px-6 py-4 max-w-md">
        <p className="text-sm text-gray-700">{task.description || 'No description'}</p>
      </td>
      <td className="px-6 py-4 font-semibold text-gray-900">
        {parseFloat(task.expectedHours).toFixed(1)}h
      </td>
      <td className="px-6 py-4">
        {editingTaskId === task.taskId ? (
          <input
            type="number"
            step="0.5"
            min="0"
            value={editedActualHours}
            onChange={(e) => setEditedActualHours(e.target.value)}
            className="w-24 px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSaving}
          />
        ) : (
          <span className="font-semibold text-gray-900">
            {parseFloat(task.actualHours).toFixed(1)}h
          </span>
        )}
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
      <td className="px-6 py-4">
        {editingTaskId === task.taskId ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSaveEdit(task.taskId)}
              disabled={isSaving}
              className="text-green-600 hover:text-green-700 font-medium disabled:opacity-50 flex items-center gap-1"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Confirm
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="text-gray-600 hover:text-gray-700 font-medium disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleEditClick(task)}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        )}
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
    </div>
  );
};

// ==================== MAIN DASHBOARD ====================
export default function AdminDashboard() {
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkUserRole();
    fetchProjects();
  }, []);
  useEffect(() => {
    // Filter projects based on search term
    if (searchTerm) {
      const filtered = projects.filter(project =>
        project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        project.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProjects(filtered);
    } else {
      setFilteredProjects(projects);
    }
  }, [searchTerm, projects]);
  const checkUserRole = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      setUserRole(data.user?.role || null);
    } catch (err) {
      console.error('Error checking user role:', err);
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
  const handleExportProjects = async () => {
    setIsExporting(true);
    try {
      const dataToExport = formatProjectsForExport(filteredProjects);
      downloadCSV(dataToExport, 'projects_export');
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportProjectDetails = async () => {
    if (!projectDetails) return;

    setIsExporting(true);
    try {
      const dataToExport = formatProjectDetailsForExport(projectDetails);
      downloadCSV(dataToExport, `project_${projectDetails.project.projectName}_details`);
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export project details');
    } finally {
      setIsExporting(false);
    }
  };
  const handleBack = () => {
    setSelectedProjectId(null);
    setProjectDetails(null);
  };

  const handleProjectCreated = () => {
    fetchProjects();
  };

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete project');
      }

      setShowDeleteModal(false);
      setProjectToDelete(null);
      fetchProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  const isAdmin = userRole === 'platform_admin';

  if (selectedProjectId && projectDetails) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <ProjectDetailView
            projectDetails={projectDetails}
            onBack={handleBack}
            isLoading={isLoadingDetails}
            onExport={handleExportProjectDetails} // Add this
            isExporting={isExporting} // Add this
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isAdmin ? 'Admin Dashboard' : 'Projects Dashboard'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isAdmin ? 'Manage projects and track team contributions' : 'View all active projects'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAddProject(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Add New Project
            </button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchBox
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search projects by name, description, or creator..."
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            {!selectedProjectId ? (
              <DownloadButton
                onDownload={handleExportProjects}
                isLoading={isExporting}
                disabled={filteredProjects.length === 0}
                variant="outline"
              >
                Export Projects ({filteredProjects.length})
              </DownloadButton>
            ) : (
              <DownloadButton
                onDownload={handleExportProjectDetails}
                isLoading={isExporting}
                disabled={!projectDetails}
                variant="outline"
              >
                Export Project Details
              </DownloadButton>
            )}
          </div>
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
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleProjectClick(project)}
                onDelete={() => handleDeleteClick(project)}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}

        {!isLoading && projects.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">
              {isAdmin
                ? 'No projects yet. Click "Add New Project" to get started.'
                : 'No projects available.'}
            </p>
          </div>
        )}

        <AddProjectModal
          isOpen={showAddProject}
          onClose={() => setShowAddProject(false)}
          onSuccess={handleProjectCreated}
        />

        <DeleteConfirmModal
          isOpen={showDeleteModal}
          projectName={projectToDelete?.projectName || ''}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteModal(false);
            setProjectToDelete(null);
          }}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}