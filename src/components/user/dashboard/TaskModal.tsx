'use client';
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

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

export const TaskModal: React.FC<{
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

    // const expectedHours = parseFloat(formData.expectedHours);
    // if (!formData.expectedHours || isNaN(expectedHours) || expectedHours <= 0) newErrors.expectedHours = 'Expected hours must be greater than 0';

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
      const response = await fetch(`/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          taskName: formData.taskName.trim(),
          description: formData.description.trim() || null,
          // expectedHours: parseFloat(formData.expectedHours),
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

          {/* <div>
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
          </div> */}

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