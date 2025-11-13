import * as XLSX from 'xlsx-js-style';

// ==================== STYLES ====================
const styles = {
  projectHeader: {
    font: { bold: true, sz: 16, color: { rgb: "2563EB" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "E2E8F0" } },
      bottom: { style: "thin", color: { rgb: "E2E8F0" } },
      left: { style: "thin", color: { rgb: "E2E8F0" } },
      right: { style: "thin", color: { rgb: "E2E8F0" } }
    }
  },
  projectDescription: {
    font: { italic: true, sz: 11, color: { rgb: "475569" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "E2E8F0" } },
      bottom: { style: "thin", color: { rgb: "E2E8F0" } },
      left: { style: "thin", color: { rgb: "E2E8F0" } },
      right: { style: "thin", color: { rgb: "E2E8F0" } }
    }
  },
  columnHeader: {
    font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "059669" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "medium", color: { rgb: "000000" } },
      bottom: { style: "medium", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    }
  },
  dataCell: {
    font: { sz: 10 },
    alignment: { vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "E2E8F0" } },
      bottom: { style: "thin", color: { rgb: "E2E8F0" } },
      left: { style: "thin", color: { rgb: "E2E8F0" } },
      right: { style: "thin", color: { rgb: "E2E8F0" } }
    }
  },
  serialCell: {
    font: { bold: true, sz: 10 },
    fill: { fgColor: { rgb: "F8FAFC" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "E2E8F0" } },
      bottom: { style: "thin", color: { rgb: "E2E8F0" } },
      left: { style: "thin", color: { rgb: "E2E8F0" } },
      right: { style: "thin", color: { rgb: "E2E8F0" } }
    }
  },
  hoursCell: {
    font: { sz: 10, bold: false, color: { rgb: "000000" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "E2E8F0" } },
      bottom: { style: "thin", color: { rgb: "E2E8F0" } },
      left: { style: "thin", color: { rgb: "E2E8F0" } },
      right: { style: "thin", color: { rgb: "E2E8F0" } }
    }
  }
};

// ==================== EXPORT FUNCTIONS ====================

/**
 * Download Excel file with styled data
 */
export const downloadExcel = (data: any[], filename: string, sheetName: string = 'Sheet1') => {
  if (!data.length) {
    console.warn('No data to export');
    return;
  }

  try {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error generating Excel:', error);
    throw new Error('Failed to generate download file');
  }
};

/**
 * Format projects list for Excel export with styling
 */
export const formatProjectsForExport = (projects: any[]) => {
  const ws_data: any[][] = [];
  
  // Header row
  ws_data.push([
    { v: 'Project ID', s: styles.columnHeader },
    { v: 'Project Name', s: styles.columnHeader },
    { v: 'Description', s: styles.columnHeader },
    { v: 'Created By', s: styles.columnHeader },
    { v: 'Status', s: styles.columnHeader },
    { v: 'Created Date', s: styles.columnHeader },
    { v: 'Last Updated', s: styles.columnHeader }
  ]);

  // Data rows with alternating colors
  projects.forEach((project, idx) => {
    const rowStyle = idx % 2 === 0 ? styles.dataCell : { 
      ...styles.dataCell, 
      fill: { fgColor: { rgb: "F8FAFC" } } 
    };
    
    ws_data.push([
      { v: project.id, s: rowStyle },
      { v: project.projectName, s: rowStyle },
      { v: project.description || 'No description', s: rowStyle },
      { v: project.createdBy, s: rowStyle },
      { v: project.isActive ? 'Active' : 'Inactive', s: rowStyle },
      { v: new Date(project.createdAt).toLocaleDateString('en-IN'), s: rowStyle },
      { v: new Date(project.updatedAt).toLocaleDateString('en-IN'), s: rowStyle }
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 12 },  // Project ID
    { wch: 25 },  // Project Name
    { wch: 40 },  // Description
    { wch: 20 },  // Created By
    { wch: 12 },  // Status
    { wch: 15 },  // Created Date
    { wch: 15 }   // Last Updated
  ];

  return ws;
};

/**
 * Format project details for Excel export with premium styling
 * Layout: Project Name (top center - COLORED TEXT ONLY), Description (below - COLORED TEXT ONLY), then tasks table
 */
export const formatProjectDetailsForExport = (projectDetails: any) => {
  const { project, tasks } = projectDetails;
  const ws_data: any[][] = [];
  
  // Row 1: Project Name (will be merged - put value in FIRST cell)
  ws_data.push([
    { v: project.projectName, s: styles.projectHeader },
    { v: '', s: styles.projectHeader },
    { v: '', s: styles.projectHeader },
    { v: '', s: styles.projectHeader }
  ]);
  
  // Row 2: Project Description (will be merged - put value in FIRST cell)
  ws_data.push([
    { v: project.description || 'No description', s: styles.projectDescription },
    { v: '', s: styles.projectDescription },
    { v: '', s: styles.projectDescription },
    { v: '', s: styles.projectDescription }
  ]);
  
  // Row 3: Empty row for spacing
  ws_data.push([
    { v: '', s: {} },
    { v: '', s: {} },
    { v: '', s: {} },
    { v: '', s: {} }
  ]);
  
  // Row 4: Column Headers
  ws_data.push([
    { v: 'Sr. No.', s: styles.columnHeader },
    { v: 'Task Name', s: styles.columnHeader },
    { v: 'Task Description', s: styles.columnHeader },
    { v: 'Hours', s: styles.columnHeader }
  ]);
  
  // Task Data Rows with alternating colors
  tasks.forEach((task: any, index: number) => {
    const isEven = index % 2 === 0;
    const rowStyle = isEven ? styles.dataCell : { 
      ...styles.dataCell, 
      fill: { fgColor: { rgb: "F8FAFC" } } 
    };
    
    ws_data.push([
      { v: index + 1, s: styles.serialCell },
      { v: task.taskName, s: rowStyle },
      { v: task.description || 'No description', s: rowStyle },
      { v: parseFloat(task.expectedHours).toFixed(2), s: styles.hoursCell }
    ]);
  });

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  
  // Merge cells for project name and description
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }); // Project name row
  ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }); // Description row
  
  // Set column widths
  ws['!cols'] = [
    { wch: 10 },  // Sr. No.
    { wch: 30 },  // Task Name
    { wch: 50 },  // Task Description
    { wch: 15 }   // Expected Hours
  ];
  
  // Set row heights
  ws['!rows'] = [
    { hpt: 30 },  // Project name row
    { hpt: 25 },  // Description row
    { hpt: 10 },  // Empty row
    { hpt: 25 }   // Header row
  ];

  return ws;
};

/**
 * Format project tasks only (simpler format without project header)
 */
export const formatProjectTasksForExport = (projectDetails: any) => {
  const { tasks } = projectDetails;
  const ws_data: any[][] = [];
  
  // Header row
  ws_data.push([
    { v: 'Sr. No.', s: styles.columnHeader },
    { v: 'Task Name', s: styles.columnHeader },
    { v: 'Task Description', s: styles.columnHeader },
    { v: 'Expected Hours', s: styles.columnHeader }
  ]);
  
  // Task data with alternating colors
  tasks.forEach((task: any, index: number) => {
    const isEven = index % 2 === 0;
    const rowStyle = isEven ? styles.dataCell : { 
      ...styles.dataCell, 
      fill: { fgColor: { rgb: "F8FAFC" } } 
    };
    
    ws_data.push([
      { v: index + 1, s: styles.serialCell },
      { v: task.taskName, s: rowStyle },
      { v: task.description || 'No description', s: rowStyle },
      { v: parseFloat(task.expectedHours).toFixed(2), s: styles.hoursCell }
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  
  ws['!cols'] = [
    { wch: 10 },  // Sr. No.
    { wch: 30 },  // Task Name
    { wch: 50 },  // Task Description
    { wch: 15 }   // Expected Hours
  ];

  return ws;
};

/**
 * Main export function for projects list
 */
export const exportProjectsToExcel = (projects: any[], filename: string = 'projects_export') => {
  try {
    const wb = XLSX.utils.book_new();
    const ws = formatProjectsForExport(projects);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Projects List');
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error generating Excel:', error);
    throw new Error('Failed to generate download file');
  }
};

/**
 * Main export function for project details
 */
export const exportProjectDetailsToExcel = (projectDetails: any, filename?: string) => {
  try {
    const wb = XLSX.utils.book_new();
    const ws = formatProjectDetailsForExport(projectDetails);
    
    const exportFilename = filename || `project_${projectDetails.project.projectName}_details`;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Project Details');
    XLSX.writeFile(wb, `${exportFilename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error generating Excel:', error);
    throw new Error('Failed to generate download file');
  }
};

// ==================== NEW: SELECTIVE EXPORT FUNCTIONS ====================

/**
 * Export only selected projects
 */
export const exportSelectedProjectsToExcel = (
  allProjects: any[], 
  selectedProjectIds: Set<string>, 
  filename: string = 'selected_projects_export'
) => {
  try {
    // Filter only selected projects
    const selectedProjects = allProjects.filter(project => 
      selectedProjectIds.has(project.id)
    );

    if (selectedProjects.length === 0) {
      console.warn('No projects selected for export');
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws = formatProjectsForExport(selectedProjects);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Selected Projects');
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error generating Excel:', error);
    throw new Error('Failed to generate download file');
  }
};

/**
 * Export only selected tasks from project details
 */
export const exportSelectedTasksToExcel = (
  projectDetails: any,
  selectedTaskIds: Set<string>,
  filename?: string
) => {
  try {
    // Filter only selected tasks
    const selectedTasks = projectDetails.tasks.filter((task: any) => 
      selectedTaskIds.has(task.taskId)
    );

    if (selectedTasks.length === 0) {
      console.warn('No tasks selected for export');
      return;
    }

    // Create modified project details with only selected tasks
    const modifiedProjectDetails = {
      ...projectDetails,
      tasks: selectedTasks
    };

    const wb = XLSX.utils.book_new();
    const ws = formatProjectDetailsForExport(modifiedProjectDetails);
    
    const exportFilename = filename || `project_${projectDetails.project.projectName}_selected_tasks`;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Selected Tasks');
    XLSX.writeFile(wb, `${exportFilename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error generating Excel:', error);
    throw new Error('Failed to generate download file');
  }
};

/**
 * Export selected tasks with full task details (employee info, status, etc.)
 */
export const exportSelectedTasksDetailedToExcel = (
  projectDetails: any,
  selectedTaskIds: Set<string>,
  filename?: string
) => {
  try {
    const { project, tasks } = projectDetails;
    
    // Filter only selected tasks
    const selectedTasks = tasks.filter((task: any) => 
      selectedTaskIds.has(task.taskId)
    );

    if (selectedTasks.length === 0) {
      console.warn('No tasks selected for export');
      return;
    }

    const ws_data: any[][] = [];
    
    // Row 1: Project Name
    ws_data.push([
      { v: project.projectName, s: styles.projectHeader },
      { v: '', s: styles.projectHeader },
      { v: '', s: styles.projectHeader },
      { v: '', s: styles.projectHeader }
    ]);
    
    // Row 2: Project Description
    ws_data.push([
      { v: project.description || 'No description', s: styles.projectDescription },
      { v: '', s: styles.projectDescription },
      { v: '', s: styles.projectDescription },
      { v: '', s: styles.projectDescription }
    ]);
    
    // Row 3: Empty row
    ws_data.push([
      { v: '', s: {} },
      { v: '', s: {} },
      { v: '', s: {} },
      { v: '', s: {} }
    ]);
    
    // Row 4: Column Headers
    ws_data.push([
      { v: 'Sr. No.', s: styles.columnHeader },
      { v: 'Task Name', s: styles.columnHeader },
      { v: 'Description', s: styles.columnHeader },
      { v: 'Hours', s: styles.columnHeader }
    ]);
    
    // Task Data Rows
    selectedTasks.forEach((task: any, index: number) => {
      const isEven = index % 2 === 0;
      const rowStyle = isEven ? styles.dataCell : { 
        ...styles.dataCell, 
        fill: { fgColor: { rgb: "F8FAFC" } } 
      };
      
      ws_data.push([
        { v: index + 1, s: styles.serialCell },
        { v: task.taskName, s: rowStyle },
        { v: task.description || 'No description', s: rowStyle },
        { v: parseFloat(task.expectedHours).toFixed(2), s: styles.hoursCell }
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    // Merge cells
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }); // Project name
    ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }); // Description
    
    // Set column widths
    ws['!cols'] = [
      { wch: 10 },  // Sr. No.
      { wch: 30 },  // Task Name
      { wch: 50 },  // Description
      { wch: 15 }   // Hours
    ];
    
    // Set row heights
    ws['!rows'] = [
      { hpt: 30 },  // Project name
      { hpt: 25 },  // Description
      { hpt: 10 },  // Empty row
      { hpt: 25 }   // Header
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Selected Tasks');
    
    const exportFilename = filename || `project_${project.projectName}_selected_tasks`;
    XLSX.writeFile(wb, `${exportFilename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error generating Excel:', error);
    throw new Error('Failed to generate download file');
  }
};

// Legacy CSV functions for backward compatibility
export const downloadCSV = (data: any[], filename: string) => {
  console.warn('downloadCSV is deprecated. Use exportProjectsToExcel or exportProjectDetailsToExcel instead.');
  
  if (!data.length) {
    console.warn('No data to export');
    return;
  }

  try {
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] === null || row[header] === undefined ? '' : row[header];
          const escapedValue = String(value).replace(/"/g, '""');
          return `"${escapedValue}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating CSV:', error);
    throw new Error('Failed to generate download file');
  }
};