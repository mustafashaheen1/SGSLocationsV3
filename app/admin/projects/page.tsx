'use client';

import { useState, useEffect } from 'react';
import { supabase, Project } from '@/lib/supabase';
import { uploadImageToS3 } from '@/lib/s3-upload';

// Simplified type for property dropdown
type PropertyOption = {
  id: string;
  name: string;
  city: string;
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [deleteProgress, setDeleteProgress] = useState<string>('');
  const [formData, setFormData] = useState<{
    name: string;
    banner_image: string;
    property_id: string;
    display_order: number;
    status: string;
  }>({
    name: '',
    banner_image: '',
    property_id: '',
    display_order: 0,
    status: 'active'
  });

  useEffect(() => {
    fetchProjects();
    fetchProperties();
  }, []);

  async function fetchProjects() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('No session found');
        setLoading(false);
        return;
      }

      const { directFetch } = await import('@/lib/supabase');
      const { data, error } = await directFetch('projects', {
        select: `
          *,
          property:properties(*)
        `,
        order: 'display_order',
        authToken: session.access_token
      });

      if (error) {
        console.error('Error fetching projects:', error);
        return;
      }

      if (data) {
        setProjects(data);
      }
    } catch (error) {
      console.error('Error in fetchProjects:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProperties() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('No session found');
        return;
      }

      const { directFetch } = await import('@/lib/supabase');
      const { data, error } = await directFetch('properties', {
        select: 'id, name, city',
        eq: { status: 'active' },
        order: 'name',
        authToken: session.access_token
      });

      if (error) {
        console.error('Error fetching properties:', error);
        return;
      }

      if (data) {
        setProperties(data);
      }
    } catch (error) {
      console.error('Error in fetchProperties:', error);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress('Uploading image...');

      const imageUrl = await uploadImageToS3(file, 'projects');

      setFormData({ ...formData, banner_image: imageUrl });
      setUploadProgress('Upload complete!');

      setTimeout(() => setUploadProgress(''), 3000);
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Failed to upload image: ' + error.message);
      setUploadProgress('');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate required fields
    if (!formData.banner_image) {
      alert('Please upload a banner image or provide an image URL');
      return;
    }

    if (!formData.name) {
      alert('Please fill in the project name');
      return;
    }

    // Convert empty string to null for property_id
    const propertyId = formData.property_id || null;

    if (editingProject) {
      // Update existing project using REST API
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Session expired. Please log in again.');
        return;
      }

      // Check if position changed - if so, use reorder API
      if (formData.display_order !== editingProject.display_order) {
        const reorderResponse = await fetch('/api/projects/reorder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: editingProject.id,
            newPosition: formData.display_order
          })
        });

        if (!reorderResponse.ok) {
          const error = await reorderResponse.json();
          alert(`Failed to update position: ${error.error || 'Unknown error'}`);
          return;
        }

        const reorderResult = await reorderResponse.json();
        if (reorderResult.affectedCount > 0) {
          alert(`${reorderResult.message}`);
        }
      }

      // Update other fields (name, banner, property, status)
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/projects?id=eq.${editingProject.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${session.access_token}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          name: formData.name,
          banner_image: formData.banner_image,
          property_id: propertyId,
          status: formData.status
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Error updating project:', error);
        alert('Error updating project: ' + error);
        return;
      }

      alert('Project updated successfully!');
    } else {
      // Create new project using REST API
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Session expired. Please log in again.');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${session.access_token}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          name: formData.name,
          banner_image: formData.banner_image,
          property_id: propertyId,
          display_order: formData.display_order,
          status: formData.status
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Error creating project:', error);
        alert('Error creating project: ' + error);
        return;
      }

      alert('Project created successfully!');
    }

    // Reset form and refresh
    resetForm();
    fetchProjects();
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    setDeletingProjectId(id);
    setDeleteProgress('Starting deletion...');

    // Give React time to render the modal
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      setDeleteProgress('🗑️ Deleting project and adjusting positions...');

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Session expired. Please log in again.');
      }

      // Use delete API endpoint that handles position reordering
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete project');
      }

      const result = await response.json();

      setDeleteProgress('✓ Project deleted successfully!');

      // Show how many projects were repositioned
      if (result.affectedCount > 0) {
        setDeleteProgress(`✓ Project deleted! ${result.affectedCount} project(s) repositioned.`);
      }

      // Short delay to show success message
      await new Promise(resolve => setTimeout(resolve, 1500));

      await fetchProjects();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      alert('Error deleting project: ' + error.message);
    } finally {
      setDeletingProjectId(null);
      setDeleteProgress('');
    }
  }

  function handleEdit(project: Project) {
    setEditingProject(project);
    setFormData({
      name: project.name,
      banner_image: project.banner_image,
      property_id: project.property_id || '',
      display_order: project.display_order,
      status: project.status
    });
  }

  function resetForm() {
    setEditingProject(null);
    setUploadProgress('');
    setFormData({
      name: '',
      banner_image: '',
      property_id: '',
      display_order: 0,
      status: 'active'
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Manage Projects</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingProject ? 'Edit Project' : 'Add New Project'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banner Image *
                </label>

                {/* File Upload */}
                <div className="mb-2">
                  <label className="block text-sm text-gray-600 mb-1">Upload Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {uploadProgress && (
                    <p className="text-sm mt-1 text-blue-600">{uploadProgress}</p>
                  )}
                </div>

                {/* Or URL Input */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Or Enter Image URL</label>
                  <input
                    type="url"
                    value={formData.banner_image}
                    onChange={(e) => setFormData({ ...formData, banner_image: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    
                    disabled={uploading}
                  />
                </div>

                {/* Image Preview */}
                {formData.banner_image && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1">Preview:</p>
                    <img
                      src={formData.banner_image}
                      alt="Banner preview"
                      className="w-full h-32 object-cover rounded border"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EInvalid Image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property/Location (Optional)
                </label>
                <select
                  value={formData.property_id}
                  onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None - No property linked</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name} - {property.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  
                />
                <p className="text-xs text-gray-500 mt-1">
                  Position in portfolio (1 = first). Changes will automatically shift other projects.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={uploading || !formData.banner_image}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : editingProject ? 'Update Project' : 'Create Project'}
                </button>
                {editingProject && (
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={uploading}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Projects List Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Existing Projects ({projects.length})</h2>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {projects.map((project) => (
                <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={project.banner_image}
                      alt={project.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{project.name}</h3>
                      <p className="text-sm text-gray-600">
                        {project.property?.name || 'Unknown Property'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Order: {project.display_order} | Status: {project.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(project)}
                        className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="px-3 py-1 text-sm bg-red-50 text-brand rounded hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {projects.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No projects yet. Create your first project!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Deletion Progress Modal */}
      {deletingProjectId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Deleting Project</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please wait while we delete the project...
              </p>
              {deleteProgress && (
                <div className="bg-gray-50 rounded p-3 text-sm font-mono text-left">
                  {deleteProgress}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
