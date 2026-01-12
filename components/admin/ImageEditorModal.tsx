'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as fabric from 'fabric';
import {
  X, Undo2, Redo2, Type, Square, Circle,
  MousePointer2, Pencil, Trash2, Loader2, Blend, RotateCcw, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { imageDataRGBA } from 'stackblur-canvas';

interface ImageEditorModalProps {
  imageUrl: string;
  originalImageUrl?: string;
  imageTags: string[];
  onSave: (editedImageBlob: Blob) => Promise<void>;
  onRestore?: () => Promise<void>;
  onCancel: () => void;
  accessToken?: string; // Optional auth token for fetching settings
  siteLogoUrl?: string; // Optional pre-fetched logo URL
}

type Tool = 'select' | 'blur' | 'text' | 'rectangle' | 'circle' | 'pencil';

export default function ImageEditorModal({
  imageUrl,
  originalImageUrl,
  imageTags,
  onSave,
  onRestore,
  onCancel,
  accessToken,
  siteLogoUrl: initialLogoUrl
}: ImageEditorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);

  // Tool-specific properties
  const [textValue, setTextValue] = useState('');
  const [fontSize, setFontSize] = useState(24);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [blurIntensity, setBlurIntensity] = useState(10);
  const [blurPreviewUrl, setBlurPreviewUrl] = useState<string>('');
  const [siteLogoUrl, setSiteLogoUrl] = useState<string>(initialLogoUrl || '');
  const [logoWashout, setLogoWashout] = useState(false);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 1200,
      height: 800,
      backgroundColor: '#f3f4f6'
    });

    // Load the image
    fabric.FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' })
      .then((img) => {
        if (!img) {
          alert('Failed to load image. Please try again.');
          onCancel();
          return;
        }

        // Calculate canvas dimensions to fit image
        const maxWidth = window.innerWidth - 500; // Leave room for toolbars
        const maxHeight = window.innerHeight - 200;
        const maxSize = 2000; // Max dimension for performance

        const scale = Math.min(
          maxWidth / (img.width || 1),
          maxHeight / (img.height || 1),
          maxSize / Math.max(img.width || 1, img.height || 1),
          1 // Don't scale up
        );

        fabricCanvas.setDimensions({
          width: (img.width || 0) * scale,
          height: (img.height || 0) * scale
        });

        img.set({
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false
        });

        fabricCanvas.backgroundImage = img;
        fabricCanvas.renderAll();
        setCanvas(fabricCanvas);

        // Save initial state for undo
        saveHistory(fabricCanvas);
      })
      .catch((error) => {
        console.error('Error loading image:', error);
        alert('Failed to load image. Please try again.');
        onCancel();
      });

    return () => {
      fabricCanvas.dispose();
    };
  }, [imageUrl]);

  // History management
  const saveHistory = useCallback((canvas: fabric.Canvas) => {
    // Create custom JSON that includes background image info
    const canvasData = canvas.toJSON();
    const bgImage = canvas.backgroundImage;

    const customState = {
      canvas: canvasData,
      backgroundImage: bgImage && bgImage instanceof fabric.FabricImage ? {
        src: (bgImage.getElement() as HTMLImageElement).src,
        scaleX: bgImage.scaleX,
        scaleY: bgImage.scaleY
      } : null
    };

    const json = JSON.stringify(customState);

    setHistory(prev => {
      const newHistory = prev.slice(0, historyStep + 1);
      // Limit history to 50 steps
      if (newHistory.length >= 50) {
        newHistory.shift();
        return [...newHistory, json];
      }
      return [...newHistory, json];
    });
    setHistoryStep(prev => Math.min(prev + 1, 50));
  }, [historyStep]);

  const undo = useCallback(async () => {
    if (historyStep === 0 || !canvas) return;

    const newStep = historyStep - 1;
    const state = JSON.parse(history[newStep]);

    // Restore canvas objects
    canvas.loadFromJSON(state.canvas, async () => {
      // Restore background image if it exists
      if (state.backgroundImage) {
        try {
          const bgImage = await fabric.FabricImage.fromURL(state.backgroundImage.src, {
            crossOrigin: 'anonymous'
          });

          bgImage.set({
            scaleX: state.backgroundImage.scaleX,
            scaleY: state.backgroundImage.scaleY,
            selectable: false,
            evented: false
          });

          canvas.backgroundImage = bgImage;
        } catch (error) {
          console.error('Error restoring background image:', error);
        }
      }

      canvas.renderAll();
      setHistoryStep(newStep);
    });
  }, [canvas, history, historyStep]);

  const redo = useCallback(async () => {
    if (historyStep >= history.length - 1 || !canvas) return;

    const newStep = historyStep + 1;
    const state = JSON.parse(history[newStep]);

    // Restore canvas objects
    canvas.loadFromJSON(state.canvas, async () => {
      // Restore background image if it exists
      if (state.backgroundImage) {
        try {
          const bgImage = await fabric.FabricImage.fromURL(state.backgroundImage.src, {
            crossOrigin: 'anonymous'
          });

          bgImage.set({
            scaleX: state.backgroundImage.scaleX,
            scaleY: state.backgroundImage.scaleY,
            selectable: false,
            evented: false
          });

          canvas.backgroundImage = bgImage;
        } catch (error) {
          console.error('Error restoring background image:', error);
        }
      }

      canvas.renderAll();
      setHistoryStep(newStep);
    });
  }, [canvas, history, historyStep]);

  // Generate blur preview for sidebar
  const updateBlurPreview = useCallback(async () => {
    if (!canvas) return;

    const bgImage = canvas.backgroundImage;
    if (!bgImage || !(bgImage instanceof fabric.FabricImage)) return;

    // Get all blur regions from canvas objects
    const blurRegions = canvas.getObjects().filter(obj => (obj as any).data?.type === 'blur');

    if (blurRegions.length === 0) {
      // No blur regions, clear preview
      setBlurPreviewUrl('');
      return;
    }

    // Create temporary canvas for blur preview
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Use smaller dimensions for preview (max 300px width)
    const maxPreviewWidth = 300;
    const scale = Math.min(1, maxPreviewWidth / (canvas.width || 800));

    tempCanvas.width = (canvas.width || 800) * scale;
    tempCanvas.height = (canvas.height || 600) * scale;

    // Draw the background image
    const img = bgImage.getElement() as HTMLImageElement;
    tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

    // Apply blur to each region (scaled)
    for (const region of blurRegions) {
      const left = Math.max(0, Math.floor((region.left || 0) * scale));
      const top = Math.max(0, Math.floor((region.top || 0) * scale));
      const width = Math.min(tempCanvas.width - left, Math.ceil((region.width || 0) * (region.scaleX || 1) * scale));
      const height = Math.min(tempCanvas.height - top, Math.ceil((region.height || 0) * (region.scaleY || 1) * scale));
      const intensity = (region as any).data?.intensity || blurIntensity;

      if (width <= 0 || height <= 0) continue;

      const imageData = tempCtx.getImageData(left, top, width, height);
      imageDataRGBA(imageData, 0, 0, width, height, intensity);
      tempCtx.putImageData(imageData, left, top);
    }

    // Generate preview URL for sidebar
    const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.8);
    setBlurPreviewUrl(dataUrl);
  }, [canvas, blurIntensity]);

  // Fetch site logo on mount (only if not provided as prop)
  useEffect(() => {
    // If logo URL was already provided, skip fetching
    if (initialLogoUrl) return;

    async function fetchSiteLogo() {
      try {
        const headers: HeadersInit = {
          'credentials': 'include'
        };

        // If accessToken is provided, use Bearer authentication
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const response = await fetch('/api/admin/settings', {
          credentials: 'include', // Include cookies for authentication
          headers
        });

        if (!response.ok) {
          console.error('Failed to fetch settings:', response.status, response.statusText);
          return;
        }

        const data = await response.json();

        if (data.settings && Array.isArray(data.settings)) {
          const logoSetting = data.settings.find((s: any) => s.setting_key === 'site_logo_url');
          if (logoSetting?.setting_value) {
            setSiteLogoUrl(logoSetting.setting_value);
          }
        }
      } catch (error) {
        console.error('Failed to fetch site logo:', error);
      }
    }

    fetchSiteLogo();
  }, [accessToken, initialLogoUrl]);

  // Tool: Blur
  const enableBlurMode = useCallback(() => {
    if (!canvas) return;

    let isDrawing = false;
    let startX = 0;
    let startY = 0;
    let blurRect: fabric.Rect | null = null;

    canvas.isDrawingMode = false;
    canvas.selection = true; // Enable selection so blur regions can be selected/deleted

    const mouseDown = (e: any) => {
      if (!canvas) return;
      const pointer = canvas.getScenePoint(e.e);
      isDrawing = true;
      startX = pointer.x;
      startY = pointer.y;

      blurRect = new fabric.Rect({
        left: startX,
        top: startY,
        width: 0,
        height: 0,
        fill: 'rgba(100, 149, 237, 0.15)', // Light blue transparent
        stroke: '#4169E1',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        //@ts-ignore
        data: { type: 'blur', intensity: blurIntensity }
      });

      canvas.add(blurRect);
    };

    const mouseMove = (e: any) => {
      if (!isDrawing || !blurRect || !canvas) return;

      const pointer = canvas.getScenePoint(e.e);
      const width = pointer.x - startX;
      const height = pointer.y - startY;

      blurRect.set({
        width: Math.abs(width),
        height: Math.abs(height),
        left: width < 0 ? pointer.x : startX,
        top: height < 0 ? pointer.y : startY
      });

      canvas.renderAll();
    };

    const mouseUp = async () => {
      if (!canvas || !blurRect) return;
      isDrawing = false;

      const width = (blurRect.width || 0) * (blurRect.scaleX || 1);
      const height = (blurRect.height || 0) * (blurRect.scaleY || 1);

      if (width > 10 && height > 10) {
        // Keep the blur rectangle and update preview
        await updateBlurPreview();
        saveHistory(canvas);
      } else {
        // Too small, remove it
        canvas.remove(blurRect);
      }

      blurRect = null;
      canvas.renderAll();
    };

    canvas.on('mouse:down', mouseDown);
    canvas.on('mouse:move', mouseMove);
    canvas.on('mouse:up', mouseUp);

    // Cleanup
    return () => {
      canvas.off('mouse:down', mouseDown);
      canvas.off('mouse:move', mouseMove);
      canvas.off('mouse:up', mouseUp);
    };
  }, [canvas, blurIntensity, saveHistory, updateBlurPreview]);

  // Tool: Text
  const addText = useCallback(() => {
    if (!canvas || !textValue) return;

    const text = new fabric.IText(textValue, {
      left: (canvas.width || 0) / 2,
      top: (canvas.height || 0) / 2,
      fontSize: fontSize,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth > 0 ? 1 : 0,
      fontFamily: 'Arial',
      textAlign: 'center',
      originX: 'center',
      originY: 'center'
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    saveHistory(canvas);
    setTextValue('');
  }, [canvas, textValue, fontSize, fillColor, strokeColor, strokeWidth, saveHistory]);

  // Tool: Shapes
  const addShape = useCallback((shapeType: 'rectangle' | 'circle') => {
    if (!canvas) return;

    const centerX = (canvas.width || 0) / 2;
    const centerY = (canvas.height || 0) / 2;

    let shape: fabric.Object;

    if (shapeType === 'rectangle') {
      shape = new fabric.Rect({
        left: centerX - 50,
        top: centerY - 50,
        width: 100,
        height: 100,
        fill: fillColor === 'transparent' ? '' : fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth
      });
    } else {
      shape = new fabric.Circle({
        left: centerX - 50,
        top: centerY - 50,
        radius: 50,
        fill: fillColor === 'transparent' ? '' : fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth
      });
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
    saveHistory(canvas);
  }, [canvas, fillColor, strokeColor, strokeWidth, saveHistory]);

  // Tool: Logo Watermark
  const addLogoWatermark = useCallback(async () => {
    if (!canvas || !siteLogoUrl) {
      alert('No logo available. Please upload a logo in Settings first.');
      return;
    }

    try {
      // Load logo image
      const logoImg = await fabric.FabricImage.fromURL(siteLogoUrl, { crossOrigin: 'anonymous' });

      // Calculate size (max 20% of canvas width)
      const maxWidth = (canvas.width || 800) * 0.2;
      const scale = maxWidth / (logoImg.width || 1);

      // Apply washout effect if enabled
      const filters = logoWashout ? [
        new fabric.Image.filters.Brightness({ brightness: 0.3 }), // Increase brightness
        new fabric.Image.filters.Contrast({ contrast: -0.3 }), // Reduce contrast
      ] : [];

      logoImg.set({
        left: (canvas.width || 800) - maxWidth - 20, // Bottom right, 20px padding
        top: (canvas.height || 600) - (logoImg.height || 1) * scale - 20,
        scaleX: scale,
        scaleY: scale,
        opacity: logoWashout ? 0.3 : 1, // Reduce opacity for washout
        selectable: true,
        hasControls: true, // Enable resize handles
        hasBorders: true,
        lockUniScaling: true, // Maintain aspect ratio when resizing
        filters: filters,
        //@ts-ignore
        data: { type: 'logo', washout: logoWashout } // Store washout state in object
      });

      // Apply filters
      if (logoWashout) {
        logoImg.applyFilters();
      }

      canvas.add(logoImg);
      canvas.setActiveObject(logoImg);
      saveHistory(canvas);
      canvas.renderAll();
    } catch (error) {
      console.error('Failed to add logo watermark:', error);
      alert('Failed to add logo watermark. Please try again.');
    }
  }, [canvas, siteLogoUrl, logoWashout, saveHistory]);

  // Tool: Pencil
  const enableDrawingMode = useCallback((enable: boolean) => {
    if (!canvas) return;

    canvas.isDrawingMode = enable;
    if (enable && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = strokeColor;
      canvas.freeDrawingBrush.width = strokeWidth;
    }
  }, [canvas, strokeColor, strokeWidth]);

  // Listen to drawing events
  useEffect(() => {
    if (!canvas) return;

    const handlePathCreated = () => {
      saveHistory(canvas);
    };

    const handleSelection = () => {
      const activeObject = canvas.getActiveObject();
      setSelectedObject(activeObject || null);
    };

    const handleSelectionCleared = () => {
      setSelectedObject(null);
    };

    canvas.on('path:created', handlePathCreated);
    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', handleSelectionCleared);

    return () => {
      canvas.off('path:created', handlePathCreated);
      canvas.off('selection:created', handleSelection);
      canvas.off('selection:updated', handleSelection);
      canvas.off('selection:cleared', handleSelectionCleared);
    };
  }, [canvas, saveHistory]);

  // Listen to object changes for blur preview updates
  useEffect(() => {
    if (!canvas) return;

    const handleObjectModified = () => {
      updateBlurPreview();
    };

    const handleObjectRemoved = () => {
      updateBlurPreview();
    };

    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:removed', handleObjectRemoved);

    return () => {
      canvas.off('object:modified', handleObjectModified);
      canvas.off('object:removed', handleObjectRemoved);
    };
  }, [canvas, updateBlurPreview]);

  // Tool selection
  useEffect(() => {
    if (!canvas) return;

    if (selectedTool === 'blur') {
      const cleanup = enableBlurMode();
      return cleanup;
    } else if (selectedTool === 'pencil') {
      // Enable drawing mode for pencil tool
      canvas.isDrawingMode = true;
      canvas.selection = false; // Disable selection while drawing
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = strokeColor;
        canvas.freeDrawingBrush.width = strokeWidth;
      }
    } else {
      // Reset canvas state for other tools
      canvas.isDrawingMode = false;
      canvas.selection = true;
    }
  }, [selectedTool, canvas, enableBlurMode, strokeColor, strokeWidth]);

  // Process blur regions and export final image
  const processBlurAndExport = async (
    blurRegions: Array<{ left: number; top: number; width: number; height: number; intensity: number }>,
    otherObjects: fabric.Object[]
  ) => {
    if (!canvas) return;

    // Create temporary canvas for processing
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Set dimensions to match the main canvas
    tempCanvas.width = canvas.width || 800;
    tempCanvas.height = canvas.height || 600;

    // Draw the background image first
    const bgImage = canvas.backgroundImage;
    if (bgImage && bgImage instanceof fabric.FabricImage) {
      const img = bgImage.getElement() as HTMLImageElement;
      tempCtx.drawImage(
        img,
        0,
        0,
        tempCanvas.width,
        tempCanvas.height
      );
    }

    // Apply blur to each region
    for (const region of blurRegions) {
      // Ensure region boundaries are within canvas
      const left = Math.max(0, Math.floor(region.left));
      const top = Math.max(0, Math.floor(region.top));
      const width = Math.min(tempCanvas.width - left, Math.ceil(region.width));
      const height = Math.min(tempCanvas.height - top, Math.ceil(region.height));

      if (width <= 0 || height <= 0) continue;

      // Extract the region to blur
      const imageData = tempCtx.getImageData(left, top, width, height);

      // Apply Gaussian blur using stackblur
      imageDataRGBA(
        imageData,
        0,
        0,
        width,
        height,
        region.intensity
      );

      // Put the blurred region back
      tempCtx.putImageData(imageData, left, top);
    }

    // Now draw other objects (text, shapes, etc.) on top
    // Create a temporary Fabric canvas for this
    const fabricTempCanvas = new fabric.Canvas(tempCanvas);
    fabricTempCanvas.setDimensions({
      width: tempCanvas.width,
      height: tempCanvas.height
    });

    // Add the blurred image as background
    const tempDataUrl = tempCanvas.toDataURL();
    const blurredImage = await fabric.FabricImage.fromURL(tempDataUrl);
    fabricTempCanvas.backgroundImage = blurredImage;

    // Add other objects
    for (const obj of otherObjects) {
      const clonedObj = await obj.clone();
      fabricTempCanvas.add(clonedObj);
    }

    fabricTempCanvas.renderAll();

    // Export the final result
    const finalDataUrl = fabricTempCanvas.toDataURL({
      format: 'jpeg',
      quality: 0.9,
      multiplier: 1
    });

    const blob = await (await fetch(finalDataUrl)).blob();
    await onSave(blob);

    // Cleanup
    fabricTempCanvas.dispose();
  };

  // Save handler
  const handleSave = async () => {
    if (!canvas || saving) return;

    setSaving(true);
    try {
      // Deselect all objects
      canvas.discardActiveObject();
      canvas.renderAll();

      // Get blur regions
      const blurRegions = canvas.getObjects().filter(obj => (obj as any).data?.type === 'blur');
      const otherObjects = canvas.getObjects().filter(obj => !(obj as any).data?.type);

      if (blurRegions.length > 0) {
        // Apply blur to background and export with other objects
        const bgImage = canvas.backgroundImage;
        if (bgImage && bgImage instanceof fabric.FabricImage) {
          // Create temp canvas for blur processing
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) throw new Error('Failed to get canvas context');

          tempCanvas.width = canvas.width || 800;
          tempCanvas.height = canvas.height || 600;

          // Draw background
          const img = bgImage.getElement() as HTMLImageElement;
          tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

          // Apply all blur regions
          for (const region of blurRegions) {
            const left = Math.max(0, Math.floor(region.left || 0));
            const top = Math.max(0, Math.floor(region.top || 0));
            const width = Math.min(tempCanvas.width - left, Math.ceil((region.width || 0) * (region.scaleX || 1)));
            const height = Math.min(tempCanvas.height - top, Math.ceil((region.height || 0) * (region.scaleY || 1)));
            const intensity = (region as any).data?.intensity || 10;

            if (width <= 0 || height <= 0) continue;

            const imageData = tempCtx.getImageData(left, top, width, height);
            imageDataRGBA(imageData, 0, 0, width, height, intensity);
            tempCtx.putImageData(imageData, left, top);
          }

          // Create new fabric canvas with blurred background
          const fabricTempCanvas = new fabric.Canvas(document.createElement('canvas'));
          fabricTempCanvas.setDimensions({ width: tempCanvas.width, height: tempCanvas.height });

          const blurredBg = await fabric.FabricImage.fromURL(tempCanvas.toDataURL());
          fabricTempCanvas.backgroundImage = blurredBg;

          // Add other objects (text, shapes, etc.)
          for (const obj of otherObjects) {
            const cloned = await obj.clone();
            fabricTempCanvas.add(cloned);
          }

          fabricTempCanvas.renderAll();

          // Export
          const dataUrl = fabricTempCanvas.toDataURL({ format: 'jpeg', quality: 0.9, multiplier: 1 });
          const blob = await (await fetch(dataUrl)).blob();
          await onSave(blob);

          fabricTempCanvas.dispose();
        }
      } else {
        // No blur, just export normally
        const dataUrl = canvas.toDataURL({ format: 'jpeg', quality: 0.9, multiplier: 1 });
        const blob = await (await fetch(dataUrl)).blob();
        await onSave(blob);
      }

    } catch (error) {
      console.error('Error saving edited image:', error);
      alert('Failed to save edited image. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteSelectedObject = () => {
    if (canvas && selectedObject) {
      canvas.remove(selectedObject);
      canvas.renderAll();
      setSelectedObject(null);
      saveHistory(canvas);
    }
  };

  const tools = [
    { id: 'select' as Tool, name: 'Select', icon: MousePointer2 },
    { id: 'blur' as Tool, name: 'Blur', icon: Blend },
    { id: 'text' as Tool, name: 'Text', icon: Type },
    { id: 'rectangle' as Tool, name: 'Rectangle', icon: Square },
    { id: 'circle' as Tool, name: 'Circle', icon: Circle },
    { id: 'pencil' as Tool, name: 'Draw', icon: Pencil },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between border-b border-gray-700">
        <div>
          <h2 className="text-xl font-bold">Image Editor</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {imageTags.length > 0 && `Tags: ${imageTags.join(', ')}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={undo}
            disabled={historyStep <= 1}
            size="sm"
            className="bg-gray-700 text-white border border-gray-600 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Undo2 className="w-4 h-4 mr-1" />
            Undo
          </Button>
          <Button
            onClick={redo}
            disabled={historyStep >= history.length - 1}
            size="sm"
            className="bg-gray-700 text-white border border-gray-600 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Redo2 className="w-4 h-4 mr-1" />
            Redo
          </Button>

          <div className="w-px h-8 bg-gray-600 mx-2" />

          {/* Restore Original - Only show if originalImageUrl exists */}
          {originalImageUrl && onRestore && (
            <>
              <Button
                onClick={onRestore}
                size="sm"
                className="bg-yellow-600 text-white border border-yellow-500 hover:bg-yellow-500"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore Original
              </Button>
              <div className="w-px h-8 bg-gray-600 mx-2" />
            </>
          )}

          <Button
            onClick={onCancel}
            size="sm"
            disabled={saving}
            className="bg-gray-700 text-white border border-gray-600 hover:bg-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            size="sm"
            disabled={saving}
            className="bg-brand hover:bg-brand-hover"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools */}
        <div className="w-20 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 gap-2">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                selectedTool === tool.id
                  ? 'bg-brand text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
              title={tool.name}
            >
              <tool.icon className="w-5 h-5" />
            </button>
          ))}

          {/* Separator */}
          <div className="w-10 h-px bg-gray-600 my-2" />

          {/* Logo Watermark Tool */}
          <button
            onClick={addLogoWatermark}
            disabled={!siteLogoUrl}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
              !siteLogoUrl
                ? 'text-gray-600 cursor-not-allowed opacity-50'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
            title={siteLogoUrl ? 'Add Logo Watermark' : 'No logo available (upload in Settings)'}
          >
            <ImageIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 flex items-center justify-center bg-gray-900 overflow-auto p-8">
          <canvas ref={canvasRef} className="shadow-2xl" />
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto p-6">
          <h3 className="text-white font-semibold mb-4">Properties</h3>

          {selectedTool === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Text</label>
                <Input
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  placeholder="Enter text..."
                  className="bg-gray-700 border-gray-600 text-white"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && textValue) {
                      addText();
                    }
                  }}
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Font Size: {fontSize}px</label>
                <input
                  type="range"
                  min="12"
                  max="120"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Color</label>
                <Input
                  type="color"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="h-10"
                />
              </div>
              <Button
                onClick={addText}
                disabled={!textValue}
                className="w-full bg-brand hover:bg-brand-hover"
              >
                Add Text
              </Button>
            </div>
          )}

          {selectedTool === 'blur' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Blur Intensity: {blurIntensity}px</label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={blurIntensity}
                  onChange={async (e) => {
                    const newIntensity = Number(e.target.value);
                    setBlurIntensity(newIntensity);

                    // Update intensity for all existing blur regions
                    if (canvas) {
                      canvas.getObjects().forEach(obj => {
                        if ((obj as any).data?.type === 'blur') {
                          (obj as any).data.intensity = newIntensity;
                        }
                      });

                      // Re-render blur preview with new intensity
                      await updateBlurPreview();
                    }
                  }}
                  className="w-full"
                />
              </div>
              <p className="text-xs text-gray-400">
                Click and drag on the canvas to create blur regions
              </p>

              {blurPreviewUrl && (
                <div className="mt-4 border border-gray-600 rounded-lg overflow-hidden">
                  <div className="bg-gray-700 px-3 py-2 text-xs text-gray-300 font-semibold">
                    Preview
                  </div>
                  <div className="p-2 bg-gray-900">
                    <img
                      src={blurPreviewUrl}
                      alt="Blur preview"
                      className="w-full h-auto rounded"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {(selectedTool === 'rectangle' || selectedTool === 'circle') && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Stroke Color</label>
                <Input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="h-10"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Fill Color</label>
                <Input
                  type="color"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="h-10"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Stroke Width: {strokeWidth}px</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <Button
                onClick={() => addShape(selectedTool)}
                className="w-full bg-brand hover:bg-brand-hover"
              >
                Add {selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)}
              </Button>
            </div>
          )}

          {selectedTool === 'pencil' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Brush Color</label>
                <Input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => {
                    setStrokeColor(e.target.value);
                    if (canvas?.isDrawingMode && canvas.freeDrawingBrush) {
                      canvas.freeDrawingBrush.color = e.target.value;
                    }
                  }}
                  className="h-10"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Brush Width: {strokeWidth}px</label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={strokeWidth}
                  onChange={(e) => {
                    const width = Number(e.target.value);
                    setStrokeWidth(width);
                    if (canvas?.isDrawingMode && canvas.freeDrawingBrush) {
                      canvas.freeDrawingBrush.width = width;
                    }
                  }}
                  className="w-full"
                />
              </div>
              <p className="text-xs text-gray-400">
                Draw directly on the canvas with your mouse
              </p>
            </div>
          )}

          {/* Logo Watermark Settings - Show when no specific tool is selected or in select mode */}
          {(selectedTool === 'select' || !selectedTool) && siteLogoUrl && (
            <div className="space-y-4 mb-6">
              <h4 className="text-sm text-gray-400 font-semibold uppercase tracking-wider">Logo Watermark</h4>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded-lg">
                <label className="text-sm text-gray-300 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={logoWashout}
                    onChange={(e) => setLogoWashout(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-brand focus:ring-brand"
                  />
                  Washout Effect
                </label>
              </div>
              <p className="text-xs text-gray-400">
                Enable washout to make the logo lighter and more subtle (like Microsoft Word's washout feature)
              </p>
              <Button
                onClick={addLogoWatermark}
                className="w-full bg-brand hover:bg-brand-hover"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Add Logo
              </Button>
            </div>
          )}

          {selectedObject && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h4 className="text-white font-semibold mb-3">Selected Object</h4>
              <Button
                onClick={deleteSelectedObject}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
