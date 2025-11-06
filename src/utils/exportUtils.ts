// // utils/exportUtils.ts
// export const downloadCSV = (data: any[], filename: string) => {
//   if (!data.length) {
//     console.warn('No data to export');
//     return;
//   }

//   try {
//     const headers = Object.keys(data[0]);
    
//     // Create CSV content with proper escaping
//     const csvContent = [
//       headers.join(','),
//       ...data.map(row => 
//         headers.map(header => {
//           const value = row[header] === null || row[header] === undefined ? '' : row[header];
//           // Escape quotes and wrap in quotes
//           const escapedValue = String(value).replace(/"/g, '""');
//           return `"${escapedValue}"`;
//         }).join(',')
//       )
//     ].join('\n');

//     // Create and trigger download
//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const link = document.createElement('a');
//     const url = URL.createObjectURL(blob);
    
//     link.setAttribute('href', url);
//     link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
//     link.style.visibility = 'hidden';
    
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     URL.revokeObjectURL(url);
//   } catch (error) {
//     console.error('Error generating CSV:', error);
//     throw new Error('Failed to generate download file');
//   }
// };

// export const formatProjectsForExport = (projects: any[]) => {
//   return projects.map(project => ({
//     'Project ID': project.id,
//     'Project Name': project.projectName,
//     'Description': project.description || 'No description',
//     'Created By': project.createdBy,
//     'Status': project.isActive ? 'Active' : 'Inactive',
//     'Created Date': new Date(project.createdAt).toLocaleDateString('en-IN'),
//     'Last Updated': new Date(project.updatedAt).toLocaleDateString('en-IN')
//   }));
// };

// export const formatProjectDetailsForExport = (projectDetails: any) => {
//   const { project, tasks, summary, employees } = projectDetails;
  
//   // Project Summary
//   const summaryData = [{
//     'Type': 'PROJECT SUMMARY',
//     'Project Name': project.projectName,
//     'Total Tasks': summary.totalTasks,
//     'Total Expected Hours': parseFloat(summary.totalExpectedHours).toFixed(2),
//     'Total Actual Hours': parseFloat(summary.totalActualHours).toFixed(2),
//     'Variance': parseFloat(summary.variance).toFixed(2),
//     'Variance Percentage': summary.variancePercentage + '%'
//   }];

//   // Employee Summary
//   const employeeData = employees.map((emp: any) => ({
//     'Type': 'EMPLOYEE SUMMARY',
//     'Employee Name': emp.employeeName,
//     'Employee Email': emp.employeeEmail,
//     'Total Tasks': emp.totalTasks,
//     'Total Expected Hours': emp.totalExpectedHours.toFixed(2),
//     'Total Actual Hours': emp.totalActualHours.toFixed(2),
//     'Approved Tasks': emp.approvedTasks,
//     'Pending Tasks': emp.pendingTasks,
//     'Rejected Tasks': emp.rejectedTasks
//   }));

//   // Task Details
//   const taskData = tasks.map((task: any) => ({
//     'Type': 'TASK DETAIL',
//     'Task Name': task.taskName,
//     'Employee Name': task.employeeName,
//     'Employee Email': task.employeeEmail,
//     'Description': task.description || 'No description',
//     'Expected Hours': parseFloat(task.expectedHours).toFixed(2),
//     'Actual Hours': parseFloat(task.actualHours).toFixed(2),
//     'Status': task.status.charAt(0).toUpperCase() + task.status.slice(1),
//     'Created Date': new Date(task.createdAt).toLocaleDateString('en-IN'),
//     'Approved Date': task.approvedAt ? new Date(task.approvedAt).toLocaleDateString('en-IN') : 'Not Approved'
//   }));

//   return [...summaryData, ...employeeData, ...taskData];
// };

// // Generic data export function
// export const exportToCSV = (data: any[], filename: string, customHeaders?: string[]) => {
//   if (!data.length) return;

//   const headers = customHeaders || Object.keys(data[0]);
//   const csvContent = [
//     headers.join(','),
//     ...data.map(row => 
//       headers.map(header => {
//         const value = row[header] === null || row[header] === undefined ? '' : row[header];
//         return `"${String(value).replace(/"/g, '""')}"`;
//       }).join(',')
//     )
//   ].join('\n');

//   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//   const link = document.createElement('a');
//   const url = URL.createObjectURL(blob);
  
//   link.setAttribute('href', url);
//   link.setAttribute('download', `${filename}.csv`);
//   link.style.visibility = 'hidden';
  
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);
// };


// utils/exportUtils.ts
export const downloadCSV = (data: any[], filename: string) => {
  if (!data.length) {
    console.warn('No data to export');
    return;
  }

  try {
    const headers = Object.keys(data[0]);
    
    // Create CSV content with proper escaping
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] === null || row[header] === undefined ? '' : row[header];
          // Escape quotes and wrap in quotes
          const escapedValue = String(value).replace(/"/g, '""');
          return `"${escapedValue}"`;
        }).join(',')
      )
    ].join('\n');

    // Create and trigger download
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

export const formatProjectsForExport = (projects: any[]) => {
  return projects.map(project => ({
    'Project ID': project.id,
    'Project Name': project.projectName,
    'Description': project.description || 'No description',
    'Created By': project.createdBy,
    'Status': project.isActive ? 'Active' : 'Inactive',
    'Created Date': new Date(project.createdAt).toLocaleDateString('en-IN'),
    'Last Updated': new Date(project.updatedAt).toLocaleDateString('en-IN')
  }));
};

export const formatProjectDetailsForExport = (projectDetails: any) => {
  const { project, tasks, summary } = projectDetails;
  
  // Only export task details with project context
  const taskData = tasks.map((task: any) => ({
    'Project Name': project.projectName,
    'Project Description': project.description || 'No description',
    'Task Name': task.taskName,
    'Task Description': task.description || 'No description',
    'Employee Name': task.employeeName,
    'Employee Email': task.employeeEmail,
    'Expected Hours': parseFloat(task.expectedHours).toFixed(2),
    'Actual Hours': parseFloat(task.actualHours).toFixed(2),
    'Variance': (parseFloat(task.actualHours) - parseFloat(task.expectedHours)).toFixed(2),
    'Status': task.status.charAt(0).toUpperCase() + task.status.slice(1),
    'Created Date': new Date(task.createdAt).toLocaleDateString('en-IN'),
    'Approved Date': task.approvedAt ? new Date(task.approvedAt).toLocaleDateString('en-IN') : 'Not Approved'
  }));

  // Add summary row at the top
  const summaryRow = {
    'Project Name': project.projectName,
    'Project Description': `SUMMARY: Total Tasks: ${summary.totalTasks}`,
    'Task Name': 'PROJECT TOTALS',
    'Task Description': `Variance: ${parseFloat(summary.variance).toFixed(2)}h (${summary.variancePercentage}%)`,
    'Employee Name': '-',
    'Employee Email': '-',
    'Expected Hours': parseFloat(summary.totalExpectedHours).toFixed(2),
    'Actual Hours': parseFloat(summary.totalActualHours).toFixed(2),
    'Variance': parseFloat(summary.variance).toFixed(2),
    'Status': '-',
    'Created Date': new Date(project.createdAt).toLocaleDateString('en-IN'),
    'Approved Date': '-'
  };

  return [summaryRow, ...taskData];
};

// Alternative: Export tasks only (cleaner for task analysis)
export const formatProjectTasksForExport = (projectDetails: any) => {
  const { project, tasks } = projectDetails;
  
  return tasks.map((task: any) => ({
    'Project Name': project.projectName,
    'Task Name': task.taskName,
    'Task Description': task.description || 'No description',
    'Employee Name': task.employeeName,
    'Employee Email': task.employeeEmail,
    'Expected Hours': parseFloat(task.expectedHours).toFixed(2),
    'Actual Hours': parseFloat(task.actualHours).toFixed(2),
    'Variance': (parseFloat(task.actualHours) - parseFloat(task.expectedHours)).toFixed(2),
    'Status': task.status.charAt(0).toUpperCase() + task.status.slice(1),
    'Created Date': new Date(task.createdAt).toLocaleDateString('en-IN'),
    'Approved Date': task.approvedAt ? new Date(task.approvedAt).toLocaleDateString('en-IN') : 'Not Approved'
  }));
};

// Generic data export function
export const exportToCSV = (data: any[], filename: string, customHeaders?: string[]) => {
  if (!data.length) return;

  const headers = customHeaders || Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] === null || row[header] === undefined ? '' : row[header];
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};