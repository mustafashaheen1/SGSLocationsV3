'use client';

import Image from 'next/image';

interface GridPreviewProps {
  images: { url: string }[];
}

export function GridPreview({ images }: GridPreviewProps) {
  const gridImages = images.slice(0, 6);
  const missingCount = Math.max(0, 6 - gridImages.length);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Property Grid Preview</h3>
        <p className="text-sm text-gray-600">
          The first 6 images will be displayed on the property page.
          {images.length >= 6 ? (
            <span className="text-green-600 font-medium"> ✓ Grid complete ({gridImages.length}/6)</span>
          ) : (
            <span className="text-red-600 font-medium"> ⚠ Need {missingCount} more image{missingCount !== 1 ? 's' : ''} ({gridImages.length}/6)</span>
          )}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Drag and drop images above to reorder which photos appear in the grid
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {gridImages.map((image, index) => (
          <div
            key={index}
            className="relative aspect-[4/3] bg-gray-100 rounded overflow-hidden border-2 border-gray-300"
          >
            <Image
              src={image.url}
              alt={`Grid image ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, 200px"
            />
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
              #{index + 1}
            </div>
          </div>
        ))}

        {/* Placeholder boxes for missing images */}
        {Array.from({ length: missingCount }).map((_, index) => (
          <div
            key={`placeholder-${index}`}
            className="relative aspect-[4/3] bg-gray-50 rounded border-2 border-dashed border-gray-300 flex items-center justify-center"
          >
            <div className="text-center text-gray-400">
              <div className="text-2xl mb-1">+</div>
              <div className="text-xs">Image {gridImages.length + index + 1}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
