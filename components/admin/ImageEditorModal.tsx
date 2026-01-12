'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as fabric from 'fabric';
import {
  X, Undo2, Redo2, Type, Square, Circle,
  MousePointer2, Pencil, Trash2, Loader2, Blend, RotateCcw
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
}

type Tool = 'select' | 'blur' | 'text' | 'rectangle' | 'circle' | 'pencil';

export default function ImageEditorModal({
  imageUrl,
  originalImageUrl,
  imageTags,
  onSave,
  onRestore,
  onCancel
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

  // Tool: Blur
  const enableBlurMode = useCallback(() => {
    if (!canvas) return;

    let isDrawing = false;
    let startX = 0;
    let startY = 0;
    let blurRect: fabric.Rect | null = null;

    canvas.isDrawingMode = false;
    canvas.selection = false;

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
        fill: 'rgba(255, 165, 0, 0.2)',
        stroke: '#fe751f',
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

    const mouseUp = () => {
      if (!canvas) return;
      isDrawing = false;
      if (blurRect) {
        saveHistory(canvas);
      }
      blurRect = null;
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
  }, [canvas, blurIntensity, saveHistory]);

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

  // Tool selection
  useEffect(() => {
    if (!canvas) return;

    // Reset canvas state
    canvas.isDrawingMode = false;
    canvas.selection = true;

    if (selectedTool === 'blur') {
      const cleanup = enableBlurMode();
      return cleanup;
    } else if (selectedTool === 'pencil') {
      enableDrawingMode(true);
    } else {
      enableDrawingMode(false);
    }
  }, [selectedTool, canvas, enableBlurMode, enableDrawingMode]);

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

      // Get all canvas objects
      const objects = canvas.getObjects();

      // Separate blur rectangles from other objects
      const blurRegions: Array<{
        left: number;
        top: number;
        width: number;
        height: number;
        intensity: number;
      }> = [];

      const otherObjects: fabric.Object[] = [];

      objects.forEach(obj => {
        // Check if this is a blur rectangle
        if ((obj as any).data?.type === 'blur') {
          blurRegions.push({
            left: obj.left || 0,
            top: obj.top || 0,
            width: (obj.width || 0) * (obj.scaleX || 1),
            height: (obj.height || 0) * (obj.scaleY || 1),
            intensity: (obj as any).data.intensity || 10
          });
        } else {
          otherObjects.push(obj);
        }
      });

      // If there are blur regions, process them
      if (blurRegions.length > 0) {
        await processBlurAndExport(blurRegions, otherObjects);
      } else {
        // No blur, just export as before
        const dataUrl = canvas.toDataURL({
          format: 'jpeg',
          quality: 0.9,
          multiplier: 1
        });

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
            disabled={historyStep === 0}
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
                  onChange={(e) => setBlurIntensity(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <p className="text-xs text-gray-400">
                Click and drag on the canvas to create blur regions
              </p>
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
