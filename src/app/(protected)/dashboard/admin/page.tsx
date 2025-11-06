'use client';

import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, Calendar, X, Loader2, CheckCircle2, Clock, Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { downloadCSV, formatProjectDetailsForExport, formatProjectsForExport } from '@/utils/exportUtils';
import DownloadButton from '@/components/DownloadButton';
import SearchBox from '@/components/SearchBox';
import {AddProjectModal} from '@/components/admin/dashboard/AddProjectModal';
import {DeleteConfirmModal} from '@/components/admin/dashboard/DeleteConfirmModal';
import {ProjectCard} from '@/components/admin/dashboard/ProjectCard';
import {ProjectDetailView} from "@/components/admin/dashboard/ProjectDetailView"
import Navigation from '@/components/pages/Navbar';

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
   <>

    <Navigation/>
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
   </>
  );
}