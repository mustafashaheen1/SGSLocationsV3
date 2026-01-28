'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Check } from 'lucide-react';

interface GridPreviewProps {
  images: { url: string }[];
  gridIndices: number[];
  onGridIndicesChange: (indices: number[]) => void;
}

export function GridPreview({ images, gridIndices, onGridIndicesChange }: GridPreviewProps) {
  const [showSelector, setShowSelector] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [recentlySwapped, setRecentlySwapped] = useState<number[]>([]);
  const missingCount = Math.max(0, 6 - gridIndices.length);

  const handleImageSelect = (index: number) => {
    if (gridIndices.includes(index)) {
      // Deselect - only if we have more than 6 selected
      if (gridIndices.length > 6) {
        onGridIndicesChange(gridIndices.filter(i => i !== index));
      }
    } else {
      // Select - replace oldest selection if we already have 6
      if (gridIndices.length >= 6) {
        const newIndices = [...gridIndices];
        newIndices.shift(); // Remove first one
        newIndices.push(index);
        onGridIndicesChange(newIndices);
      } else {
        onGridIndicesChange([...gridIndices, index]);
      }
    }
  };

  const handleRemoveFromGrid = (gridIndex: number) => {
    if (gridIndices.length <= 6) {
      alert('You must have at least 6 grid images. Add a replacement image first.');
      return;
    }
    const imageIndex = gridIndices[gridIndex];
    onGridIndicesChange(gridIndices.filter(i => i !== imageIndex));
  };

  // Drag and drop handlers for reordering all images
  const handleDragStart = (e: React.DragEvent, imageIndex: number) => {
    const selectionOrder = gridIndices.indexOf(imageIndex) + 1;
    if (selectionOrder < 1) return; // Only allow dragging selected images

    setDraggedIndex(imageIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', imageIndex.toString());
  };

  const handleDragOver = (e: React.DragEvent, imageIndex: number) => {
    e.preventDefault();

    const selectionOrder = gridIndices.indexOf(imageIndex) + 1;
    if (selectionOrder < 1) return; // Only allow dropping on selected images
    if (imageIndex === draggedIndex) return;

    setDragOverIndex(imageIndex);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropTargetIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null) return;

    const draggedPosition = gridIndices.indexOf(draggedIndex);
    const targetPosition = gridIndices.indexOf(dropTargetIndex);

    if (draggedPosition === -1 || targetPosition === -1) return;

    // Swap positions in array (works for all images, not just grid)
    const newGridIndices = [...gridIndices];
    newGridIndices[draggedPosition] = dropTargetIndex;
    newGridIndices[targetPosition] = draggedIndex;

    onGridIndicesChange(newGridIndices);

    // Highlight the swapped images (first 6 positions are grid images)
    setRecentlySwapped([draggedIndex, dropTargetIndex]);
    setTimeout(() => setRecentlySwapped([]), 1500); // Clear highlight after 1.5s

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Property Grid Preview</h3>
          <button
            type="button"
            onClick={() => setShowSelector(!showSelector)}
            className="text-sm bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            {showSelector ? 'Close Selector' : 'Change Grid Images'}
          </button>
        </div>
        <p className="text-sm text-gray-600">
          These 6 images will be displayed on the property page.
          {gridIndices.length >= 6 ? (
            <span className="text-green-600 font-medium"> ✓ Grid complete ({gridIndices.length}/6)</span>
          ) : (
            <span className="text-red-600 font-medium"> ⚠ Need {missingCount} more image{missingCount !== 1 ? 's' : ''} ({gridIndices.length}/6)</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {gridIndices.slice(0, 6).map((imageIndex, gridIndex) => {
          const isSwapped = recentlySwapped.includes(imageIndex);
          return (
            <div
              key={gridIndex}
              className={`relative aspect-[4/3] bg-gray-100 rounded overflow-hidden border-2 group transition-all duration-300
                ${isSwapped ? 'border-blue-500 ring-4 ring-blue-300 scale-105' : 'border-gray-300'}
              `}
            >
            <Image
              src={images[imageIndex]?.url || ''}
              alt={`Grid image ${gridIndex + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, 200px"
            />
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
              #{gridIndex + 1}
            </div>
            {showSelector && (
              <button
                type="button"
                onClick={() => handleRemoveFromGrid(gridIndex)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          );
        })}

        {/* Placeholder boxes for missing images */}
        {Array.from({ length: missingCount }).map((_, index) => (
          <div
            key={`placeholder-${index}`}
            className="relative aspect-[4/3] bg-gray-50 rounded border-2 border-dashed border-gray-300 flex items-center justify-center"
          >
            <div className="text-center text-gray-400">
              <div className="text-2xl mb-1">+</div>
              <div className="text-xs">Image {gridIndices.length + index + 1}</div>
            </div>
          </div>
        ))}
      </div>

      {showSelector && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-3">
            Select Grid Images (Choose 6) - Drag to reorder positions
          </h4>
          <div className="grid grid-cols-4 gap-2 max-h-[400px] overflow-y-auto p-2 bg-gray-50 rounded">
            {(() => {
              // Create sorted array: ALL selected images first (in selection order), then unselected
              const selectedIndices = gridIndices; // All selected images in order (grid + additional)
              const unselectedIndices = images
                .map((_, idx) => idx)
                .filter(idx => !gridIndices.includes(idx));
              const sortedIndices = [...selectedIndices, ...unselectedIndices];

              return sortedIndices.map((index) => {
                const image = images[index];
                const isSelected = gridIndices.includes(index);
                const selectionOrder = isSelected ? gridIndices.indexOf(index) + 1 : null;
                const isDragging = draggedIndex === index;
                const isDropTarget = dragOverIndex === index;
                const isDraggable = isSelected && selectionOrder !== null; // All selected images are draggable
                const isSwapped = recentlySwapped.includes(index);
                const isGridImage = selectionOrder !== null && selectionOrder <= 6;

                return (
                <div
                  key={index}
                  draggable={isDraggable}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleImageSelect(index)}
                  className={`relative aspect-square bg-gray-100 rounded overflow-hidden border-2 transition-all group
                    ${isSelected
                      ? 'border-green-500 ring-2 ring-green-200'
                      : 'border-gray-200 hover:border-gray-400'
                    }
                    ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                    ${isDragging ? 'opacity-50 scale-95' : ''}
                    ${isDropTarget ? 'ring-4 ring-blue-400 border-blue-500' : ''}
                    ${isSwapped ? 'ring-4 ring-blue-300 scale-105' : ''}
                  `}
                >
                  <Image
                    src={image.url}
                    alt={`Image ${index + 1}`}
                    fill
                    className="object-cover pointer-events-none"
                    sizes="150px"
                  />
                  {isSelected && selectionOrder && (
                    <div className={`absolute top-1 right-1 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold ${
                      isGridImage ? 'bg-green-600' : 'bg-gray-600'
                    }`}>
                      {selectionOrder}
                    </div>
                  )}
                  {isDraggable && !isDragging && (
                    <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      Drag
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                    #{index + 1}
                  </div>
                </div>
              );
              });
            })()}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Click to add/remove images. Drag any image to reorder. Green numbers (1-6) are grid images, gray numbers (7+) are additional images.
          </p>
        </div>
      )}
    </div>
  );
}
