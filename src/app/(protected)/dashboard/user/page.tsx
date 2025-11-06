'use client';

import React, { useState, useEffect } from 'react';
import {ProjectCard} from '@/components/user/dashboard/ProjectCard';
import {ProjectTasksView} from '@/components/user/dashboard/ProjectTaskView';
import { Loader2 } from 'lucide-react';
import NavBar from '@/components/common/NavBar';
import DashboardNavBar from '@/components/common/DashboardNavBar';
import Navigation from '@/components/pages/Navbar';

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
    <>
  
      <Navigation/>
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
    </>
  );
}
