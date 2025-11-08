import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Edit2, Loader2, X, Trash2, UserPlus, Users } from "lucide-react";
import Swal from 'sweetalert2';
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
  assignments?: ProjectAssignment[];
}

interface ProjectAssignment {
  id: string;
  userId: string;
  projectId: string;
  assignedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    profilePic?: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  profilePic?: string;
  isActive: boolean;
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

export const ProjectDetailView: React.FC<{
  projectDetails: ProjectDetails;
  onBack: () => void;
  isLoading: boolean;
  onExport?: () => void;
  isExporting?: boolean;
  userRole?: string;
}> = ({ projectDetails, onBack, isLoading, onExport, isExporting, userRole }) => {

  const { project, tasks, summary, employees } = projectDetails;

  // ✅ Local State (tasks copy)
  const [allTasks, setAllTasks] = useState<Task[]>(tasks);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTaskName, setEditedTaskName] = useState('');
  const [editedExpectedHours, setEditedExpectedHours] = useState('');
  const [editedStatus, setEditedStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Search
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(allTasks);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeSummary[]>(employees);

  // User Assignment States
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<ProjectAssignment[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const isAdmin = userRole === 'platform_admin';

  // ✅ Load assignments from project data on mount
  useEffect(() => {
    if (project.assignments && project.assignments.length > 0) {
      setAssignedUsers(project.assignments);
    }
  }, [project.assignments]);

  // Fetch all users (for assignment dropdown)
  useEffect(() => {
    if (isAdmin) {
      fetchAllUsers();
    }
  }, [isAdmin]);

  const fetchAllUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load users',
      });
    }
  };

  // Filter tasks based on search
  useEffect(() => {
    if (taskSearchTerm) {
      const filtered = allTasks.filter(task =>
        task.taskName.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
        task.employeeName.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
        task.employeeEmail.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(taskSearchTerm.toLowerCase())) ||
        task.status.toLowerCase().includes(taskSearchTerm.toLowerCase())
      );
      setFilteredTasks(filtered);
    } else {
      setFilteredTasks(allTasks);
    }
  }, [taskSearchTerm, allTasks]);

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

  // Get available users (not already assigned)
  const availableUsers = allUsers.filter(
    user => !assignedUsers.some(assignment => assignment.userId === user.id)
  );

  // Handle user assignment
  const handleAssignUser = async () => {
    if (!selectedUserId) {
      Swal.fire({
        icon: 'warning',
        title: 'No User Selected',
        text: 'Please select a user to assign',
      });
      return;
    }

    setIsAssigning(true);

    try {
      const response = await fetch(`/api/projects/${project.id}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [selectedUserId] }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to assign user');
      }

      const user = allUsers.find(u => u.id === selectedUserId);
      
      const newAssignment: ProjectAssignment = {
        id: `temp-${selectedUserId}`,
        userId: selectedUserId,
        projectId: project.id,
        assignedAt: new Date().toISOString(),
        user: {
          id: selectedUserId,
          name: user?.name || '',
          email: user?.email || '',
          role: user?.role || '',
          profilePic: user?.profilePic,
        },
      };

      setAssignedUsers(prev => [...prev, newAssignment]);
      setSelectedUserId('');
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `${user?.name} assigned successfully!`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error assigning user:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error instanceof Error ? error.message : 'Failed to assign user',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle user removal
  const handleRemoveUser = async (userId: string, userName: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Remove ${userName} from this project?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    setRemovingUserId(userId);

    try {
      const response = await fetch(`/api/projects/${project.id}/assignments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [userId] }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove user');
      }

      setAssignedUsers(prev => prev.filter(assignment => assignment.userId !== userId));
      
      Swal.fire({
        icon: 'success',
        title: 'Removed!',
        text: `${userName} has been removed from the project`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error removing user:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error instanceof Error ? error.message : 'Failed to remove user',
      });
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleEditClick = (task: Task) => {
    setEditingTaskId(task.taskId);
    setEditedTaskName(task.taskName);
    setEditedExpectedHours(task.expectedHours);
    setEditedStatus(task.status);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditedTaskName('');
    setEditedExpectedHours('');
  };

  // ✅ Save task updates WITHOUT full page reload
  const handleSaveEdit = async (taskId: string) => {
    if (!editedTaskName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Input',
        text: 'Task name cannot be empty',
      });
      return;
    }

    const expectedHoursNum = parseFloat(editedExpectedHours);
    if (isNaN(expectedHoursNum) || expectedHoursNum < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Input',
        text: 'Expected hours must be a valid positive number',
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskName: editedTaskName.trim(),
          expectedHours: expectedHoursNum,
          status: editedStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update task');
      }

      // ✅ Locally update state
      setAllTasks(prev =>
        prev.map(t =>
          t.taskId === taskId
            ? {
                ...t,
                taskName: editedTaskName,
                expectedHours: editedExpectedHours,
                status: editedStatus,
                updatedAt: new Date().toISOString(),
              }
            : t
        )
      );

      setFilteredTasks(prev =>
        prev.map(t =>
          t.taskId === taskId
            ? {
                ...t,
                taskName: editedTaskName,
                expectedHours: editedExpectedHours,
                status: editedStatus,
                updatedAt: new Date().toISOString(),
              }
            : t
        )
      );

      setEditingTaskId(null);
      setEditedTaskName('');
      setEditedExpectedHours('');
      setEditedStatus('pending');
      
      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Task updated successfully!',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error updating task:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error instanceof Error ? error.message : 'Failed to update task',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Delete task WITHOUT full page reload
  const handleDeleteTask = async (taskId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    setDeletingTaskId(taskId);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete task');
      }

      setAllTasks(prev => prev.filter(t => t.taskId !== taskId));
      setFilteredTasks(prev => prev.filter(t => t.taskId !== taskId));

      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Task has been deleted successfully',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error instanceof Error ? error.message : 'Failed to delete task',
      });
    } finally {
      setDeletingTaskId(null);
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
            disabled={allTasks.length === 0}
            variant="outline"
          >
            Export Project Data
          </DownloadButton>
        </div>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{project.projectName}</h2>
            <p className="text-gray-500 mt-1">{project.description || 'No description'}</p>
          </div>
        </div>

        {/* User Assignment Section - Only for Admin */}
        {isAdmin && (
          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Assigned Users</h3>
                <span className="text-sm text-gray-500">({assignedUsers.length})</span>
              </div>
            </div>

            {/* Simple Dropdown Assignment */}
            <div className="mb-4 flex gap-2">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isAssigning || availableUsers.length === 0}
              >
                <option value="">
                  {availableUsers.length === 0 ? 'All users assigned' : 'Select user to assign'}
                </option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleAssignUser}
                disabled={isAssigning || !selectedUserId}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Assign
                  </>
                )}
              </button>
            </div>

            {/* Assigned Users List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {assignedUsers.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No users assigned yet. Select a user from the dropdown to assign.
                </div>
              ) : (
                assignedUsers.map(assignment => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                        {assignment.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{assignment.user.name}</p>
                        <p className="text-xs text-gray-500">{assignment.user.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveUser(assignment.userId, assignment.user.name)}
                      disabled={removingUserId === assignment.userId}
                      className="text-red-600 hover:text-red-700 p-2 rounded hover:bg-red-50 disabled:opacity-50 transition-colors"
                      title="Remove user"
                    >
                      {removingUserId === assignment.userId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
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
      </div>

      {/* ==================  TASK TABLE  ================== */}
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

                  <td className="px-6 py-4">
                    {editingTaskId === task.taskId ? (
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={editedExpectedHours}
                        onChange={(e) => setEditedExpectedHours(e.target.value)}
                        className="w-24 px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSaving}
                      />
                    ) : (
                      <span className="font-semibold text-gray-900">
                        {parseFloat(task.expectedHours).toFixed(1)}h
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {parseFloat(task.actualHours).toFixed(1)}h
                  </td>

                  <td className="px-6 py-4">
                    {editingTaskId === task.taskId ? (
                      <select
                        value={editedStatus}
                        onChange={(e) => setEditedStatus(e.target.value as any)}
                        className="px-3 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSaving}
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {getStatusIcon(task.status)}
                        {task.status}
                      </span>
                    )}
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(task)}
                          className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteTask(task.taskId)}
                          disabled={deletingTaskId === task.taskId}
                          className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1 disabled:opacity-50"
                        >
                          {deletingTaskId === task.taskId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No tasks yet for this project.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};