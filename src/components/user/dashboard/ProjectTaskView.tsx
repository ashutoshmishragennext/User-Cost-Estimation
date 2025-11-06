import { useState } from "react";
import {TaskModal} from '@/components/user/dashboard/TaskModal';
import { Plus, Loader2, CheckCircle2, Clock, X } from "lucide-react";

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

export const ProjectTasksView: React.FC<{
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
                {/* <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Expected</th> */}
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
                  {/* <td className="px-6 py-4 font-semibold text-gray-900">
                    {parseFloat(task.expectedHours).toFixed(1)}h
                  </td> */}
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