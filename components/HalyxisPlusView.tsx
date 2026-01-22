
import React, { useState, useCallback } from 'react';
import { ImageUpload } from './ImageUpload';
import { PromptControls } from './PromptControls';
import { ImageDisplay } from './ImageDisplay';
import { editImageWithWaveSpeed, editImageWithWaveSpeedMultiple } from '../services/wavespeedService';
import { fileToBase64, blobToBase64 } from '../utils/fileUtils';
import { getWaveSpeedApiKey } from '../services/apiKeyService';
import type { UploadedImage, AspectRatio } from '../types';

export const HalyxisPlusView: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<UploadedImage | null>(null);
  const [additionalImages, setAdditionalImages] = useState<(UploadedImage | null)[]>([null]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [enablePromptExpansion, setEnablePromptExpansion] = useState<boolean>(false);
  const [seed, setSeed] = useState<number>(-1);

  const handleImageUpload = useCallback(async (file: File) => {
    setError(null);
    setGeneratedImage(null);
    try {
      const base64String = await fileToBase64(file);
      setOriginalImage({
        base64: base64String,
        mimeType: file.type,
      });
    } catch (err) {
      setError('Failed to process image file. Please try another one.');
      console.error(err);
    }
  }, []);

  const handleAdditionalImageUpload = useCallback(async (file: File, index: number) => {
    setError(null);
    setGeneratedImage(null);
    try {
      const base64String = await fileToBase64(file);
      setAdditionalImages(currentImages => {
        const newImages = [...currentImages];
        newImages[index] = { base64: base64String, mimeType: file.type };
        return newImages;
      });
    } catch (err) {
      setError('Failed to process image file. Please try another one.');
      console.error(err);
    }
  }, []);

  const handleAddImageSlot = () => {
    if (additionalImages.length < 2) { // Max 3 images total (1 original + 2 additional)
      setAdditionalImages(current => [...current, null]);
    }
  };

  const handleRemoveImageSlot = (index: number) => {
    setAdditionalImages(current => current.filter((_, i) => i !== index));
  };

  const getImageFromClipboard = async (): Promise<UploadedImage | null> => {
    if (!navigator.clipboard?.read) {
      setError('Clipboard pasting is not supported in your browser.');
      return null;
    }
    setError(null);
    setGeneratedImage(null);

    try {
      const clipboardItems = await navigator.clipboard.read();
      let imageBlob: Blob | null = null;
      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          imageBlob = await item.getType(imageType);
          break;
        }
      }

      if (!imageBlob) {
        setError('No image found on the clipboard.');
        return null;
      }

      const base64String = await blobToBase64(imageBlob);
      return {
        base64: base64String,
        mimeType: imageBlob.type,
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Clipboard access denied. Please grant permission in your browser settings.');
      } else {
        setError('Could not paste image from clipboard.');
        console.error('Paste error:', err);
      }
      return null;
    }
  };

  const handlePasteForOriginalImage = async () => {
    const pastedImage = await getImageFromClipboard();
    if (pastedImage) setOriginalImage(pastedImage);
  };

  const handlePasteForAdditionalImage = async (index: number) => {
    const pastedImage = await getImageFromClipboard();
    if (pastedImage) {
      setAdditionalImages(current => {
        const newImages = [...current];
        newImages[index] = pastedImage;
        return newImages;
      });
    }
  };

  const handleSubmit = useCallback(async () => {
    // Check for API key
    const apiKey = getWaveSpeedApiKey();
    if (!apiKey) {
      setError('WaveSpeed API key is not set. Please enter your API key in Creator Settings.');
      return;
    }

    if (!originalImage) {
      setError('Please upload at least one image.');
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a description for your image edit.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setLoadingStatus('Submitting request...');

    try {
      const uploadedImages = additionalImages.filter(img => img !== null) as UploadedImage[];
      const allImages = [originalImage, ...uploadedImages];

      let imageUrl: string;

      if (allImages.length > 1) {
        // Multiple images
        imageUrl = await editImageWithWaveSpeedMultiple(
          allImages,
          prompt,
          enablePromptExpansion,
          seed,
          (status) => {
            setLoadingStatus(`Status: ${status}...`);
          }
        );
      } else {
        // Single image
        imageUrl = await editImageWithWaveSpeed(
          originalImage,
          prompt,
          enablePromptExpansion,
          seed,
          (status) => {
            setLoadingStatus(`Status: ${status}...`);
          }
        );
      }

      setGeneratedImage(imageUrl);
      setLoadingStatus('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error(err);
      setError(errorMessage);
      setLoadingStatus('');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, additionalImages, prompt, enablePromptExpansion, seed]);

  const originalImageDataUrl = originalImage
    ? `data:${originalImage.mimeType};base64,${originalImage.base64}`
    : null;

  const uploadedImagesCount = additionalImages.filter(Boolean).length;
  const isReadyToGenerate = !!originalImage && !!prompt.trim();

  return (
    <main className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div className="w-full lg:w-[380px] flex-shrink-0 flex flex-col gap-8">
          {/* WaveSpeed Badge */}
          <div className="bg-gradient-to-r from-teal-900/20 to-blue-900/20 border border-teal-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div>
              <h3 className="text-sm font-bold text-teal-400 uppercase tracking-widest">Halyxis+</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Powered by WaveSpeed's advanced image editing API. Supports up to 3 input images for complex edits.
            </p>
          </div>

          {/* Image Upload Section */}
          <div className="flex flex-col gap-6">
            <ImageUpload
              title="1. Upload Image"
              ctaText="Click to upload"
              onImageUpload={handleImageUpload}
              onPaste={handlePasteForOriginalImage}
              image={originalImageDataUrl}
            />

            {/* Additional Images */}
            {additionalImages.map((image, index) => (
              <div key={index} className="relative group">
                <ImageUpload
                  title={`Additional Image ${index + 1} (Optional)`}
                  ctaText="Click to upload"
                  onImageUpload={(file) => handleAdditionalImageUpload(file, index)}
                  onPaste={() => handlePasteForAdditionalImage(index)}
                  image={image ? `data:${image.mimeType};base64,${image.base64}` : null}
                />
                {additionalImages.length > 1 && (
                  <button
                    onClick={() => handleRemoveImageSlot(index)}
                    className="absolute top-2 right-2 bg-black/60 text-gray-400 rounded-full p-1.5 hover:bg-red-500 hover:text-white transition-colors backdrop-blur-sm"
                    title="Remove Image"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}

            {additionalImages.length < 2 && (
              <button
                onClick={handleAddImageSlot}
                className="w-full border border-dashed border-gray-700 text-gray-400 font-medium py-4 rounded-xl hover:bg-white/5 hover:border-teal-500 hover:text-teal-400 transition-all text-xs uppercase tracking-widest"
              >
                + Add Another Image (Max 3 total)
              </button>
            )}
          </div>

          {/* Advanced Options */}
          <div className="bg-[#0f1115] border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Advanced Options</h3>
            
            <div className="flex items-center justify-between">
              <label htmlFor="prompt-expansion" className="text-sm text-gray-300 cursor-pointer">
                Enable Prompt Expansion
              </label>
              <input
                id="prompt-expansion"
                type="checkbox"
                checked={enablePromptExpansion}
                onChange={(e) => setEnablePromptExpansion(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-[#050608] text-teal-600 focus:ring-teal-500 focus:ring-offset-0"
              />
            </div>

            <div>
              <label htmlFor="seed" className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">
                Seed (-1 for random)
              </label>
              <input
                id="seed"
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || -1)}
                className="w-full text-sm rounded-xl bg-[#050608] border border-white/10 text-gray-200 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 py-2 px-4"
                min={-1}
              />
            </div>
          </div>

          {/* Prompt Controls */}
          <PromptControls
            prompt={prompt}
            setPrompt={setPrompt}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            isReadyToGenerate={isReadyToGenerate}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            mode="prompt"
          />
        </div>

        {/* Image Display */}
        <div className="w-full flex-grow">
          <ImageDisplay
            generatedImage={generatedImage}
            isLoading={isLoading}
            error={error}
            prompt={prompt}
          />
          {isLoading && loadingStatus && (
            <div className="mt-4 text-center">
              <p className="text-xs text-teal-400 font-medium">{loadingStatus}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
