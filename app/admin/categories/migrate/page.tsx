'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number;
}

export default function CategoryMigrationPage() {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkCategories();
  }, []);

  async function checkCategories() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, parent_id, display_order')
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setMessage('Error fetching categories');
    } finally {
      setLoading(false);
    }
  }

  async function runMigration() {
    if (!confirm('This will restructure your categories. Are you sure?')) {
      return;
    }

    setMigrating(true);
    setMessage('Running migration...');

    try {
      // Step 1: Create main categories if they don't exist
      const mainCategories = [
        { name: 'Residential', slug: 'residential', description: 'Residential properties including homes, apartments, and living spaces', display_order: 1 },
        { name: 'Commercial', slug: 'commercial', description: 'Commercial properties including offices, retail, and business spaces', display_order: 2 },
        { name: 'Industrial', slug: 'industrial', description: 'Industrial properties including warehouses, factories, and production facilities', display_order: 3 }
      ];

      const createdMainCategories: { [key: string]: string } = {};

      for (const mainCat of mainCategories) {
        // Check if exists
        const { data: existing } = await (supabase
          .from('categories') as any)
          .select('id')
          .eq('slug', mainCat.slug)
          .maybeSingle();

        if (existing) {
          createdMainCategories[mainCat.slug] = existing.id;
        } else {
          const { data: created, error } = await (supabase
            .from('categories') as any)
            .insert({
              name: mainCat.name,
              slug: mainCat.slug,
              description: mainCat.description,
              display_order: mainCat.display_order,
              is_active: true,
              is_top: true,
              parent_id: null
            })
            .select('id')
            .single();

          if (error) throw error;
          if (created) {
            createdMainCategories[mainCat.slug] = created.id;
          }
        }
      }

      setMessage('Main categories created. Assigning sub-categories...');

      // Step 2: Get all existing categories that are not the main ones
      const { data: existingCategories } = await (supabase
        .from('categories') as any)
        .select('id, name, slug')
        .is('parent_id', null)
        .not('slug', 'in', '(residential,commercial,industrial)');

      if (existingCategories && existingCategories.length > 0) {
        // Round-robin assign to main categories
        const mainCatIds = [
          createdMainCategories['residential'],
          createdMainCategories['commercial'],
          createdMainCategories['industrial']
        ];

        for (let i = 0; i < existingCategories.length; i++) {
          const cat = existingCategories[i];
          const mainCatId = mainCatIds[i % 3];

          // Update category to be a sub-category
          await (supabase
            .from('categories') as any)
            .update({
              parent_id: mainCatId,
              is_top: false
            })
            .eq('id', cat.id);

          // Update properties that use this category
          await (supabase
            .from('properties') as any)
            .update({
              category_id: mainCatId,
              sub_category_id: cat.id
            })
            .eq('categories', [cat.name]);

          setMessage(`Processed ${i + 1}/${existingCategories.length} sub-categories...`);
        }
      }

      setMessage('Migration completed successfully!');
      setTimeout(() => {
        checkCategories();
      }, 1000);
    } catch (error) {
      console.error('Migration error:', error);
      setMessage(`Error: ${error}`);
    } finally {
      setMigrating(false);
    }
  }

  const mainCategories = categories.filter(cat => !cat.parent_id);
  const subCategories = categories.filter(cat => cat.parent_id);

  const hasExpectedMainCategories =
    mainCategories.some(cat => cat.slug === 'residential') &&
    mainCategories.some(cat => cat.slug === 'commercial') &&
    mainCategories.some(cat => cat.slug === 'industrial');

  const needsMigration = !hasExpectedMainCategories || mainCategories.length !== 3;

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Category Migration</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Category Migration Tool</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Current State</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Total Categories</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Main Categories</p>
              <p className="text-2xl font-bold">{mainCategories.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Sub-Categories</p>
              <p className="text-2xl font-bold">{subCategories.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Migration Status</p>
              <p className={`text-2xl font-bold ${needsMigration ? 'text-orange-600' : 'text-green-600'}`}>
                {needsMigration ? 'Needed' : 'Complete'}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Main Categories:</h3>
            <ul className="list-disc list-inside">
              {mainCategories.map(cat => (
                <li key={cat.id} className={cat.slug.match(/^(residential|commercial|industrial)$/) ? 'text-green-600' : 'text-orange-600'}>
                  {cat.name} ({cat.slug})
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Sub-Categories:</h3>
            {subCategories.length > 0 ? (
              <ul className="list-disc list-inside">
                {subCategories.slice(0, 10).map(cat => (
                  <li key={cat.id}>
                    {cat.name}
                  </li>
                ))}
                {subCategories.length > 10 && <li>... and {subCategories.length - 10} more</li>}
              </ul>
            ) : (
              <p className="text-gray-500">None</p>
            )}
          </div>
        </div>

        {needsMigration && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-orange-800 mb-2">Migration Required</h2>
            <p className="text-orange-700 mb-4">
              Your categories need to be restructured into the new hierarchical format with 3 main categories (Residential, Commercial, Industrial).
            </p>
            <button
              onClick={runMigration}
              disabled={migrating}
              className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {migrating ? 'Running Migration...' : 'Run Migration'}
            </button>
          </div>
        )}

        {message && (
          <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
