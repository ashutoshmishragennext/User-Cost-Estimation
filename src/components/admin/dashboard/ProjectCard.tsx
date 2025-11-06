import { Calendar, ChevronRight, Trash2 } from "lucide-react";

interface Project {
  id: string;
  projectName: string;
  description: string | null;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const ProjectCard: React.FC<{
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