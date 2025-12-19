'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

interface SearchFilter {
  id: string;
  name: string;
  slug: string;
}

interface FilterTag {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

export default function FilterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [filter, setFilter] = useState<SearchFilter | null>(null);
  const [tags, setTags] = useState<FilterTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchFilterAndTags();
  }, [params.id]);

  async function fetchFilterAndTags() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('No session found');
        setLoading(false);
        return;
      }

      const { directFetch } = await import('@/lib/supabase');
      const { data: filterData, error: filterError } = await directFetch('search_filters', {
        select: '*',
        eq: { id: params.id },
        single: true,
        authToken: session.access_token
      });

      if (filterError) throw filterError;
      setFilter(filterData);

      const { data: tagsData, error: tagsError } = await directFetch('search_filter_tags', {
        select: '*',
        eq: { filter_id: params.id },
        order: 'display_order',
        authToken: session.access_token
      });

      if (tagsError) throw tagsError;
      setTags(tagsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async function handleAddTag() {
    if (!newTagName.trim()) {
      alert('Please enter a tag name');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Session expired. Please log in again.');
        return;
      }

      const slug = generateSlug(newTagName);
      const nextOrder = tags.length > 0 ? Math.max(...tags.map(t => t.display_order)) + 1 : 1;

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/search_filter_tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${session.access_token}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          filter_id: params.id,
          name: newTagName,
          slug: slug,
          display_order: nextOrder,
          is_active: true,
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      setNewTagName('');
      setShowAddForm(false);
      fetchFilterAndTags();
    } catch (error: any) {
      alert('Error adding tag: ' + error.message);
    }
  }

  async function handleDeleteTag(id: string, name: string) {
    if (!confirm(`Delete "${name}" tag?`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Session expired. Please log in again.');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/search_filter_tags?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${session.access_token}`,
          'Prefer': 'return=minimal'
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      fetchFilterAndTags();
    } catch (error: any) {
      alert('Error deleting tag: ' + error.message);
    }
  }

  function toggleTagSelection(tagId: string) {
    const newSelection = new Set(selectedTags);
    if (newSelection.has(tagId)) {
      newSelection.delete(tagId);
    } else {
      newSelection.add(tagId);
    }
    setSelectedTags(newSelection);
  }

  function selectAll() {
    const allTagIds = new Set(tags.map(tag => tag.id));
    setSelectedTags(allTagIds);
  }

  function deselectAll() {
    setSelectedTags(new Set());
  }

  async function handleBulkDelete() {
    if (selectedTags.size === 0) {
      alert('Please select tags to delete');
      return;
    }

    const selectedTagNames = tags
      .filter(tag => selectedTags.has(tag.id))
      .map(tag => tag.name)
      .join(', ');

    if (!confirm(`Delete ${selectedTags.size} selected tag(s)?\n\n${selectedTagNames}`)) {
      return;
    }

    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Session expired. Please log in again.');
        return;
      }

      // Delete all selected tags
      const deletePromises = Array.from(selectedTags).map(tagId =>
        fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/search_filter_tags?id=eq.${tagId}`, {
          method: 'DELETE',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${session.access_token}`,
            'Prefer': 'return=minimal'
          }
        })
      );

      const responses = await Promise.all(deletePromises);

      // Check if any failed
      const failed = responses.filter(r => !r.ok);
      if (failed.length > 0) {
        throw new Error(`Failed to delete ${failed.length} tag(s)`);
      }

      setSelectedTags(new Set());
      fetchFilterAndTags();
    } catch (error: any) {
      alert('Error deleting tags: ' + error.message);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!filter) {
    return <div className="p-6">Filter not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/admin/search-filters')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Filters
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{filter.name}</h1>
          <p className="text-gray-600">{tags.length} tags</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Tags</h2>
          <div className="flex gap-2">
            {tags.length > 0 && (
              <>
                {selectedTags.size === tags.length ? (
                  <Button variant="outline" onClick={deselectAll}>
                    Deselect All
                  </Button>
                ) : (
                  <Button variant="outline" onClick={selectAll}>
                    Select All
                  </Button>
                )}
                {selectedTags.size > 0 && (
                  <Button
                    variant="destructive"
                    onClick={handleBulkDelete}
                    disabled={deleting}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected ({selectedTags.size})
                  </Button>
                )}
              </>
            )}
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Tag
            </Button>
          </div>
        </div>

        {showAddForm && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <label className="block text-sm font-medium mb-2">Tag Name</label>
            <div className="flex gap-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g., Swimming Pool"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <Button onClick={handleAddTag}>Add</Button>
              <Button variant="outline" onClick={() => {
                setShowAddForm(false);
                setNewTagName('');
              }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {tags.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No tags yet. Add some tags to get started.
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className={`flex items-center gap-2 p-3 border rounded-lg transition-colors ${
                  selectedTags.has(tag.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedTags.has(tag.id)}
                  onChange={() => toggleTagSelection(tag.id)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
                <span className="text-sm font-medium flex-1">{tag.name}</span>
                <button
                  onClick={() => handleDeleteTag(tag.id, tag.name)}
                  className="text-red-600 hover:text-red-800"
                  title="Delete this tag"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
