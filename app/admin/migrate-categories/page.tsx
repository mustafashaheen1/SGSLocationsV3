'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function MigrateCategoriesPage() {
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function runMigration() {
    if (!confirm('This will restructure all categories into 3 main categories (Residential, Commercial, Industrial) with existing categories as sub-categories. Continue?')) {
      return;
    }

    setMigrating(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/migrate-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Migration failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Migration error:', err);
    } finally {
      setMigrating(false);
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Category Migration</h1>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">What this migration does:</h2>
          <ul className="list-disc list-inside space-y-2 text-blue-800">
            <li>Creates 3 main categories: <strong>Residential</strong>, <strong>Commercial</strong>, <strong>Industrial</strong></li>
            <li>Converts all existing categories into sub-categories under these 3 main categories</li>
            <li>Distributes existing categories evenly across the 3 main categories (round-robin)</li>
            <li>Updates all properties to reference both main category and sub-category</li>
            <li>Preserves all existing category data (names, slugs, images, etc.)</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">Important Notes:</h3>
              <ul className="list-disc list-inside space-y-1 text-yellow-800 text-sm">
                <li>This migration requires the <code className="bg-yellow-100 px-1 rounded">parent_id</code> column in the <code className="bg-yellow-100 px-1 rounded">categories</code> table</li>
                <li>This migration requires the <code className="bg-yellow-100 px-1 rounded">sub_category_id</code> column in the <code className="bg-yellow-100 px-1 rounded">properties</code> table</li>
                <li>If these columns don't exist, add them via Supabase SQL Editor first:</li>
              </ul>
              <div className="mt-3 bg-yellow-900 text-yellow-50 p-3 rounded font-mono text-xs overflow-x-auto">
                <pre>{`-- Add parent_id to categories
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE CASCADE;

-- Add sub_category_id to properties
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS sub_category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_properties_sub_category_id ON properties(sub_category_id);`}</pre>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <Button
            onClick={runMigration}
            disabled={migrating}
            className="bg-red-600 hover:bg-red-700 text-white"
            size="lg"
          >
            {migrating ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Running Migration...
              </>
            ) : (
              'Run Category Migration'
            )}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">Migration Failed</h3>
                <p className="text-red-800">{error}</p>
                <p className="text-sm text-red-700 mt-2">
                  If you see an error about missing columns, run the SQL commands above in Supabase SQL Editor.
                </p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-900 text-lg">Migration Completed Successfully!</h3>
                <p className="text-green-800">{result.message}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="text-2xl font-bold text-green-700">{result.stats?.mainCategories || 3}</div>
                <div className="text-sm text-gray-600">Main Categories</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="text-2xl font-bold text-green-700">{result.stats?.subCategories || 0}</div>
                <div className="text-sm text-gray-600">Sub-Categories Created</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="text-2xl font-bold text-red-700">{result.stats?.errors || 0}</div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </div>

            {result.propertyDistribution && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Property Distribution:</h4>
                <div className="grid grid-cols-3 gap-4">
                  {result.propertyDistribution.map((dist: any) => (
                    <div key={dist.category} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-lg font-semibold text-gray-800">{dist.count}</div>
                      <div className="text-sm text-gray-600">{dist.category}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.converted && result.converted.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Converted Categories:</h4>
                <div className="bg-white rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Sub-Category</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Main Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.converted.map((item: any, idx: number) => (
                        <tr key={idx} className="border-t border-gray-100">
                          <td className="px-4 py-2">{item.name}</td>
                          <td className="px-4 py-2 text-gray-600">{item.mainCategory}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {result.errors && result.errors.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-red-900 mb-3">Errors:</h4>
                <div className="bg-red-50 rounded-lg border border-red-200 p-4">
                  <ul className="list-disc list-inside space-y-1 text-red-800 text-sm">
                    {result.errors.map((err: any, idx: number) => (
                      <li key={idx}>{err.name}: {err.error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
