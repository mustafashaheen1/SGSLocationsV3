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

  useEffect(() => {
    fetchFilterAndTags();
  }, [params.id]);

  async function fetchFilterAndTags() {
    try {
      const { data: filterData, error: filterError } = await supabase
        .from('search_filters')
        .select('*')
        .eq('id', params.id)
        .single();

      if (filterError) throw filterError;
      setFilter(filterData);

      const { data: tagsData, error: tagsError } = await supabase
        .from('search_filter_tags')
        .select('*')
        .eq('filter_id', params.id)
        .order('display_order');

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
      const slug = generateSlug(newTagName);
      const nextOrder = tags.length > 0 ? Math.max(...tags.map(t => t.display_order)) + 1 : 1;

      const { error } = await supabase
        .from('search_filter_tags')
        .insert([{
          filter_id: params.id,
          name: newTagName,
          slug: slug,
          display_order: nextOrder,
          is_active: true,
        }]);

      if (error) throw error;

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
      const { error } = await supabase
        .from('search_filter_tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchFilterAndTags();
    } catch (error: any) {
      alert('Error deleting tag: ' + error.message);
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
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tag
          </Button>
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
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <span className="text-sm font-medium">{tag.name}</span>
                <button
                  onClick={() => handleDeleteTag(tag.id, tag.name)}
                  className="text-red-600 hover:text-red-800"
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
