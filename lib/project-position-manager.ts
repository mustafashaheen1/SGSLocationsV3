/**
 * Portfolio Project Position Management Utility
 *
 * Manages project display_order positions with automatic shifting and gap filling.
 * Ensures positions are always sequential (1, 2, 3...) with no duplicates or gaps.
 */

import { supabase as defaultSupabase } from './supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export interface PositionUpdateResult {
  success: boolean;
  oldPosition?: number;
  newPosition: number;
  affectedCount: number;
  message: string;
}

export interface Project {
  id: string;
  display_order: number;
  [key: string]: any;
}

/**
 * Update a project's position with automatic shifting of other projects
 */
export async function updateProjectPosition(
  projectId: string,
  newPosition: number,
  supabaseClient?: SupabaseClient
): Promise<PositionUpdateResult> {
  const supabase = supabaseClient || defaultSupabase;

  try {
    const { data, error } = await (supabase as any).rpc('update_project_position', {
      project_id: projectId,
      new_position: newPosition
    });

    if (error) {
      console.error('Error updating project position:', error);
      return {
        success: false,
        newPosition,
        affectedCount: 0,
        message: `Failed to update position: ${error.message}`
      };
    }

    if (data && data.length > 0) {
      const result = data[0];
      return {
        success: result.success,
        oldPosition: result.old_position,
        newPosition,
        affectedCount: result.affected_count || 0,
        message: result.message
      };
    }

    return {
      success: false,
      newPosition,
      affectedCount: 0,
      message: 'No response from database function'
    };
  } catch (error: any) {
    console.error('Exception in updateProjectPosition:', error);
    return {
      success: false,
      newPosition,
      affectedCount: 0,
      message: `Error: ${error.message}`
    };
  }
}

/**
 * Normalize all project positions to sequential numbering (1, 2, 3...)
 * Removes gaps and ensures consistent ordering
 */
export async function normalizeAllPositions(
  supabaseClient?: SupabaseClient
): Promise<PositionUpdateResult> {
  const supabase = supabaseClient || defaultSupabase;

  try {
    const { data, error } = await (supabase as any).rpc('normalize_project_positions');

    if (error) {
      console.error('Error normalizing positions:', error);
      return {
        success: false,
        newPosition: 0,
        affectedCount: 0,
        message: `Failed to normalize: ${error.message}`
      };
    }

    const affectedCount = data || 0;
    return {
      success: true,
      newPosition: 0,
      affectedCount,
      message: `Normalized ${affectedCount} project positions`
    };
  } catch (error: any) {
    console.error('Exception in normalizeAllPositions:', error);
    return {
      success: false,
      newPosition: 0,
      affectedCount: 0,
      message: `Error: ${error.message}`
    };
  }
}

/**
 * Get the next available position for a new project
 * Returns max position + 1
 */
export async function getNextPosition(
  supabaseClient?: SupabaseClient
): Promise<number> {
  const supabase = supabaseClient || defaultSupabase;

  try {
    const { data, error } = await (supabase as any).rpc('get_next_project_position');

    if (error) {
      console.error('Error getting next position:', error);
      // Fallback: query projects directly
      const { data: projects, error: projectsError } = await (supabase as any)
        .from('projects')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1);

      if (projectsError || !projects || projects.length === 0) {
        return 1; // Default to 1 if no projects exist
      }

      return (projects[0].display_order || 0) + 1;
    }

    return data || 1;
  } catch (error: any) {
    console.error('Exception in getNextPosition:', error);
    return 1; // Default to 1 on error
  }
}

/**
 * Delete a project and renumber remaining projects to close the gap
 */
export async function deleteProjectAndReorder(
  projectId: string,
  supabaseClient?: SupabaseClient
): Promise<PositionUpdateResult> {
  const supabase = supabaseClient || defaultSupabase;

  try {
    // Get the project's current position before deleting
    const { data: project, error: fetchError} = await (supabase as any)
      .from('projects')
      .select('display_order')
      .eq('id', projectId)
      .single();

    if (fetchError || !project) {
      return {
        success: false,
        newPosition: 0,
        affectedCount: 0,
        message: 'Project not found'
      };
    }

    const deletedPosition = project.display_order;

    // Delete the project
    const { error: deleteError } = await (supabase as any)
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (deleteError) {
      return {
        success: false,
        newPosition: 0,
        affectedCount: 0,
        message: `Failed to delete project: ${deleteError.message}`
      };
    }

    // Shift projects after the deleted position down by 1
    const { data: shiftData, error: shiftError } = await (supabase as any).rpc(
      'shift_project_positions',
      {
        target_position: deletedPosition + 1,
        shift_amount: -1,
        exclude_project_id: null
      }
    );

    if (shiftError) {
      console.error('Error shifting positions after delete:', shiftError);
      // Project is deleted but positions may have gaps - attempt normalize
      await normalizeAllPositions(supabase);
    }

    const affectedCount = shiftData || 0;

    return {
      success: true,
      oldPosition: deletedPosition,
      newPosition: 0,
      affectedCount,
      message: `Project deleted. Shifted ${affectedCount} projects down.`
    };
  } catch (error: any) {
    console.error('Exception in deleteProjectAndReorder:', error);
    return {
      success: false,
      newPosition: 0,
      affectedCount: 0,
      message: `Error: ${error.message}`
    };
  }
}

/**
 * Insert a new project at a specific position with automatic shifting
 */
export async function insertProjectAtPosition(
  projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>,
  position?: number,
  supabaseClient?: SupabaseClient
): Promise<{ success: boolean; projectId?: string; message: string }> {
  const supabase = supabaseClient || defaultSupabase;

  try {
    // If no position specified, append to end
    const targetPosition = position || (await getNextPosition(supabase));

    // Validate position
    const { data: projectCount } = await (supabase as any)
      .from('projects')
      .select('id', { count: 'exact', head: true });

    const totalProjects = (projectCount as any) || 0;

    if (targetPosition < 1 || targetPosition > totalProjects + 1) {
      return {
        success: false,
        message: `Invalid position. Must be between 1 and ${totalProjects + 1}`
      };
    }

    // Shift existing projects if needed (only if not appending to end)
    if (targetPosition <= totalProjects) {
      await (supabase as any).rpc('shift_project_positions', {
        target_position: targetPosition,
        shift_amount: 1,
        exclude_project_id: null
      });
    }

    // Insert the new project
    const { data: newProject, error: insertError } = await (supabase as any)
      .from('projects')
      .insert([{ ...projectData, display_order: targetPosition }])
      .select('id')
      .single();

    if (insertError) {
      // Rollback the shift if insert failed
      if (targetPosition <= totalProjects) {
        await (supabase as any).rpc('shift_project_positions', {
          target_position: targetPosition,
          shift_amount: -1,
          exclude_project_id: null
        });
      }

      return {
        success: false,
        message: `Failed to insert project: ${insertError.message}`
      };
    }

    return {
      success: true,
      projectId: newProject.id,
      message: `Project inserted at position ${targetPosition}`
    };
  } catch (error: any) {
    console.error('Exception in insertProjectAtPosition:', error);
    return {
      success: false,
      message: `Error: ${error.message}`
    };
  }
}

/**
 * Verify that all positions are sequential with no gaps or duplicates
 */
export async function verifyPositions(
  supabaseClient?: SupabaseClient
): Promise<{
  isValid: boolean;
  gaps: number[];
  duplicates: number[];
  message: string;
}> {
  const supabase = supabaseClient || defaultSupabase;

  try {
    const { data: projects, error } = await (supabase as any)
      .from('projects')
      .select('id, display_order')
      .order('display_order', { ascending: true });

    if (error || !projects) {
      return {
        isValid: false,
        gaps: [],
        duplicates: [],
        message: 'Failed to fetch projects'
      };
    }

    const positions = projects.map((p: any) => p.display_order);
    const gaps: number[] = [];
    const duplicates: number[] = [];
    const seen = new Set<number>();

    // Check for duplicates
    for (const pos of positions) {
      if (seen.has(pos)) {
        if (!duplicates.includes(pos)) {
          duplicates.push(pos);
        }
      }
      seen.add(pos);
    }

    // Check for gaps (should be 1, 2, 3, ...)
    const expected = Array.from({ length: projects.length }, (_, i) => i + 1);
    for (let i = 0; i < expected.length; i++) {
      if (!seen.has(expected[i])) {
        gaps.push(expected[i]);
      }
    }

    const isValid = gaps.length === 0 && duplicates.length === 0;

    let message = isValid ? 'All positions are sequential and unique' : '';
    if (gaps.length > 0) {
      message += `Found gaps at positions: ${gaps.join(', ')}. `;
    }
    if (duplicates.length > 0) {
      message += `Found duplicates at positions: ${duplicates.join(', ')}.`;
    }

    return {
      isValid,
      gaps,
      duplicates,
      message: message.trim()
    };
  } catch (error: any) {
    return {
      isValid: false,
      gaps: [],
      duplicates: [],
      message: `Error: ${error.message}`
    };
  }
}
