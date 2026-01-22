
import React, { useCallback, useState } from 'react';
import { UploadIcon, ClipboardIcon } from './IconComponents';

interface ImageUploadProps {
  title: string;
  ctaText: string;
  onImageUpload: (file: File) => void;
  image: string | null;
  onPaste?: () => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ title, ctaText, onImageUpload, image, onPaste }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageUpload(e.dataTransfer.files[0]);
    }
  }, [onImageUpload]);

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <div className="bg-[#0f1115] border border-white/5 rounded-2xl p-4 shadow-sm flex flex-col">
       <h3 className="text-xs font-bold text-gray-400 mb-3 text-center tracking-widest uppercase">{title}</h3>
       <div className={`flex-grow border border-dashed rounded-xl transition-all duration-300 overflow-hidden ${isDragging ? 'border-teal-500 bg-teal-900/10' : 'border-gray-700 hover:border-teal-500/50'}`}>
        <label
            htmlFor={title.replace(/\s+/g, '-').toLowerCase()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className="flex flex-col items-center justify-center w-full h-48 cursor-pointer relative"
        >
            {image ? (
            <img src={image} alt="Uploaded preview" className="object-contain h-full w-full opacity-80 hover:opacity-100 transition-opacity" />
            ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center p-4">
                <UploadIcon className={`w-8 h-8 mb-3 transition-colors ${isDragging ? 'text-teal-400' : 'text-gray-600'}`} />
                <p className="mb-2 text-sm text-gray-400">
                <span className="font-semibold text-teal-400">{ctaText}</span>
                </p>
                <p className="text-xs text-gray-600">PNG, JPG, or WEBP</p>
            </div>
            )}
            <input id={title.replace(/\s+/g, '-').toLowerCase()} type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
        </label>
       </div>
       {onPaste && (
        <button
          onClick={(e) => { e.preventDefault(); onPaste(); }}
          className="w-full mt-3 flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
          title="Paste image from clipboard"
        >
          <ClipboardIcon className="w-3.5 h-3.5" />
          Paste
        </button>
       )}
    </div>
  );
};
