import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Edit2, Loader2, TrendingDown, TrendingUp, X } from "lucide-react";
import DownloadButton from '@/components/DownloadButton';
import SearchBox from '@/components/SearchBox';
import Navigation from "@/components/pages/Navbar";


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

export const ProjectDetailView: React.FC<{
  projectDetails: ProjectDetails;
  onBack: () => void;
  isLoading: boolean;
  onExport?: () => void; // Add this
  isExporting?: boolean; // Add this
}> = ({ projectDetails, onBack, isLoading, onExport, isExporting }) => {
  const { project, tasks, summary, employees } = projectDetails;


const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
const [editedTaskName, setEditedTaskName] = useState('');
// const [editedActualHours, setEditedActualHours] = useState('');
const [editedExpectedHours, setEditedExpectedHours] = useState('');
const [editedStatus, setEditedStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

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
      // setEditedActualHours(task.actualHours);
      setEditedExpectedHours(task.expectedHours);
      setEditedStatus(task.status); // Add this line
    };

    const handleCancelEdit = () => {
      setEditingTaskId(null);
      setEditedTaskName('');
      // setEditedActualHours('');
      setEditedExpectedHours('');
    };

    const handleSaveEdit = async (taskId: string) => {
      if (!editedTaskName.trim()) {
        alert('Task name cannot be empty');
        return;
      }

  // const actualHoursNum = parseFloat(editedActualHours);
  // if (isNaN(actualHoursNum) || actualHoursNum < 0) {
  //   alert('Actual hours must be a valid positive number');
  //   return;
  // }

  const expectedHoursNum = parseFloat(editedExpectedHours);
  if (isNaN(expectedHoursNum) || expectedHoursNum < 0) {
    alert('Expected hours must be a valid positive number');
    return;
  }

  setIsSaving(true);
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskName: editedTaskName.trim(),
        // actualHours: actualHoursNum,
        expectedHours: expectedHoursNum,
        status: editedStatus, // Add this line
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to update task');
    }

    setEditingTaskId(null);
    setEditedTaskName('');
    // setEditedActualHours('');
    setEditedExpectedHours('');
    setEditedStatus('pending'); // Add this line

    // Refresh the page or refetch data
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
    <>
      {/* <Navigation/> */}
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
                  {/* <td className="px-6 py-4 font-semibold text-gray-900">
                    {parseFloat(task.expectedHours).toFixed(1)}h
                  </td> */}
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
                    onChange={(e) => setEditedStatus(e.target.value as 'pending' | 'approved' | 'rejected')}
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
    </>
  );
};