
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUpload } from './components/ImageUpload';
import { PromptControls } from './components/PromptControls';
import { ImageDisplay } from './components/ImageDisplay';
import { editImageWithPrompt, editImageWithPromptOnly, editImageWithMultiplePeople } from './services/geminiService';
import { fileToBase64, blobToBase64 } from './utils/fileUtils';
import { isAIStudioEnvironment } from './services/apiKeyService';
import type { UploadedImage, AspectRatio, HistoryItem, EditMode, User } from './types';
import { AuthPage } from './components/AuthPage';
import { LandingPage } from './components/LandingPage';
import { getUserFromDb, saveHistoryItemToDb, getHistoryFromDb } from './utils/storageUtils';
import { HistorySidebar } from './components/HistorySidebar';
import { MinusCircleIcon } from './components/IconComponents';
import { CreatorSettingsModal } from './components/CreatorSettingsModal';
import { ApiKeySelector } from './components/ApiKeySelector';
import { AppSidebar } from './components/AppSidebar';
import { HalyxisPlusView } from './components/HalyxisPlusView';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'landing' | 'auth' | 'app'>('landing');
  const [mainView, setMainView] = useState<'halyxis' | 'halyxis+'>('halyxis');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Generator State
  const [originalImage, setOriginalImage] = useState<UploadedImage | null>(null);
  const [referenceImage, setReferenceImage] = useState<UploadedImage | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<UploadedImage | null>(null);
  const [multiPersonImages, setMultiPersonImages] = useState<(UploadedImage | null)[]>([null]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [wavespeedHistory, setWavespeedHistory] = useState<HistoryItem[]>([]);
  const [mode, setMode] = useState<EditMode>('reference');
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isKeyReady, setIsKeyReady] = useState(false);

  // Check for logged-in user session on initial load
  useEffect(() => {
    const loggedInUserEmail = localStorage.getItem('ai_persona_currentUser');
    if (loggedInUserEmail) {
      const foundUser = getUserFromDb(loggedInUserEmail);
      if (foundUser) {
        setUser(foundUser);
        setView('app'); // Go straight to the app if logged in
      }
    }
  }, []);

  // Check for API key readiness when the user enters the app view
  useEffect(() => {
    if (view === 'app' && user) {
      const checkKey = async () => {
        try {
          // This gating is primarily for the AI Studio environment.
          // In other environments, we'll rely on the settings modal.
          if (isAIStudioEnvironment() && window.aistudio) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setIsKeyReady(hasKey);
          } else {
            // For non-aistudio, we'll assume a key is present via settings/env.
            // The app will show an error on generation failure if it's not.
            setIsKeyReady(true);
          }
        } catch (error) {
          console.error('Failed to check API key:', error);
          // Default to true to allow app to continue
          setIsKeyReady(true);
        }
      };
      checkKey();
    }
  }, [view, user]);

  // Load history from IndexedDB once user is logged in
  useEffect(() => {
    if (!user) return;
    const loadHistory = async () => {
      try {
        const geminiHistory = await getHistoryFromDb('gemini');
        const wavespeedHistory = await getHistoryFromDb('wavespeed');
        setHistory(geminiHistory);
        setWavespeedHistory(wavespeedHistory);
      } catch (error) {
        console.error('Failed to load history from IndexedDB:', error);
        // Set empty arrays on error to prevent crashes
        setHistory([]);
        setWavespeedHistory([]);
      }
    };
    loadHistory();
  }, [user]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('ai_persona_currentUser', loggedInUser.email);
    setView('app');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ai_persona_currentUser');
    setView('landing');
  };
  
  const handleModeChange = (newMode: EditMode) => {
    setMode(newMode);
    setError(null);
    if (newMode === 'prompt' || newMode === 'multi') {
      setReferenceImage(null);
    }
    if (newMode === 'reference') {
      setBackgroundImage(null);
    }
    if (newMode === 'multi' && multiPersonImages.length === 0) {
        setMultiPersonImages([null]);
    }
  };

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
  
  const handleReferenceImageUpload = useCallback(async (file: File) => {
    setError(null);
    setGeneratedImage(null);
    try {
      const base64String = await fileToBase64(file);
      setReferenceImage({
        base64: base64String,
        mimeType: file.type,
      });
    } catch (err) {
      setError('Failed to process reference image file. Please try another one.');
      console.error(err);
    }
  }, []);

  const handleBackgroundImageUpload = useCallback(async (file: File) => {
    setError(null);
    setGeneratedImage(null);
    try {
        const base64String = await fileToBase64(file);
        setBackgroundImage({
            base64: base64String,
            mimeType: file.type,
        });
    } catch (err) {
        setError('Failed to process background image file. Please try another one.');
        console.error(err);
    }
  }, []);

  const handleMultiPersonImageUpload = useCallback(async (file: File, index: number) => {
    setError(null);
    setGeneratedImage(null);
    try {
        const base64String = await fileToBase64(file);
        setMultiPersonImages(currentImages => {
            const newImages = [...currentImages];
            newImages[index] = { base64: base64String, mimeType: file.type };
            return newImages;
        });
    } catch (err) {
        setError('Failed to process image file. Please try another one.');
        console.error(err);
    }
  }, []);

  const handleAddPersonSlot = () => {
    setMultiPersonImages(current => [...current, null]);
  };

  const handleRemovePersonSlot = (index: number) => {
    setMultiPersonImages(current => current.filter((_, i) => i !== index));
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
            setError('Clipboard access denied. Please grant permission in your browser settings, often found by clicking the lock icon in the address bar.');
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

  const handlePasteForReferenceImage = async () => {
      const pastedImage = await getImageFromClipboard();
      if (pastedImage) setReferenceImage(pastedImage);
  };

  const handlePasteForBackgroundImage = async () => {
      const pastedImage = await getImageFromClipboard();
      if (pastedImage) setBackgroundImage(pastedImage);
  };

  const handlePasteForMultiPersonImage = async (index: number) => {
      const pastedImage = await getImageFromClipboard();
      if (pastedImage) {
          setMultiPersonImages(current => {
              const newImages = [...current];
              newImages[index] = pastedImage;
              return newImages;
          });
      }
  };

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      let newImageBase64: string;
      let referenceImageDataUrl: string | undefined = undefined;

      if (mode === 'multi') {
          const uploadedPeople = multiPersonImages.filter(img => img !== null) as UploadedImage[];
          if (uploadedPeople.length === 0) {
              setError('Please upload at least one person photo for Multi Mode.');
              setIsLoading(false);
              return;
          }
          if (!prompt.trim()) {
              setError('Please enter a description for Multi Mode.');
              setIsLoading(false);
              return;
          }
          newImageBase64 = await editImageWithMultiplePeople(
              uploadedPeople,
              prompt,
              aspectRatio,
              backgroundImage
          );
      } else if (mode === 'reference') {
        if (!originalImage || !referenceImage) {
            setError('Please upload a person photo and a reference image for Reference Mode.');
            setIsLoading(false);
            return;
        }
        newImageBase64 = await editImageWithPrompt(
          originalImage,
          referenceImage,
          prompt,
          aspectRatio,
        );
        referenceImageDataUrl = `data:${referenceImage.mimeType};base64,${referenceImage.base64}`;
      } else { // Prompt mode
        if (!originalImage || !prompt.trim()) {
           setError('Please upload a person photo and enter a description for Prompt Mode.');
           setIsLoading(false);
           return;
        }
        newImageBase64 = await editImageWithPromptOnly(
          originalImage,
          prompt,
          aspectRatio,
          backgroundImage
        );
      }
      
      const imageUrl = `data:image/png;base64,${newImageBase64}`;
      setGeneratedImage(imageUrl);
      
      const newHistoryItem: HistoryItem = {
        id: new Date().toISOString() + Math.random(),
        imageUrl: imageUrl,
        referenceImageUrl: referenceImageDataUrl, // This will be undefined for multi and prompt modes
        prompt: prompt,
        aspectRatio: aspectRatio,
        source: 'gemini',
      };
      
      const updatedHistory = [newHistoryItem, ...history];
      setHistory(updatedHistory);
      // Fire and forget save to DB
      saveHistoryItemToDb(newHistoryItem)
        .then(() => {
          // Dispatch event to notify HistorySidebar
          window.dispatchEvent(new CustomEvent('geminiHistoryUpdated'));
        })
        .catch(err => console.error("Failed to save history:", err));

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        console.error(err);

        // Specific check for AI Studio key invalidation from the error service
        if (isAIStudioEnvironment() && errorMessage.includes('Requested entity was not found')) {
            setError('Your selected API key is no longer valid. Please select a new one to continue.');
            setIsKeyReady(false); // This will show the ApiKeySelector again
        } else {
            // Display the refined error message from the service layer.
            setError(errorMessage);
        }
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, referenceImage, multiPersonImages, backgroundImage, prompt, aspectRatio, history, mode]);
  
  const handleHistorySelect = useCallback((item: HistoryItem) => {
    setGeneratedImage(item.imageUrl);
    setPrompt(item.prompt);
    setAspectRatio(item.aspectRatio);
    setError(null);
    setMainView('halyxis');
  }, []);

  if (view === 'landing') {
    return <LandingPage onGetStarted={() => setView('auth')} />;
  }

  if (view === 'auth') {
    return <AuthPage onLogin={handleLogin} />;
  }
  
  if (view === 'app' && user) {
    if (!isKeyReady) {
      // This view gates the app until a valid key is selected in AI Studio.
      return (
        <div className="min-h-screen bg-[#020408] flex items-center justify-center p-6">
            <ApiKeySelector onKeySelected={() => setIsKeyReady(true)} />
        </div>
      );
    }
    
    const originalImageDataUrl = originalImage
      ? `data:${originalImage.mimeType};base64,${originalImage.base64}`
      : null;
      
    const referenceImageDataUrl = referenceImage
      ? `data:${referenceImage.mimeType};base64,${referenceImage.base64}`
      : null;

    const backgroundImageDataUrl = backgroundImage
      ? `data:${backgroundImage.mimeType};base64,${backgroundImage.base64}`
      : null;
    
    const uploadedPeopleCount = multiPersonImages.filter(Boolean).length;
    
    const isReadyToGenerate = mode === 'reference'
      ? !!originalImage && !!referenceImage
      : mode === 'prompt'
      ? !!originalImage && !!prompt.trim()
      : mode === 'multi'
      ? uploadedPeopleCount > 0 && !!prompt.trim()
      : false;


    const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
      <button
          onClick={onClick}
          className={`w-full text-center text-sm font-medium py-3 rounded-lg transition-all duration-300 focus:outline-none ${
              isActive 
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/20' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
      >
          {label}
      </button>
    );

    return (
      <div className="min-h-screen bg-[#020408] text-gray-100 font-sans selection:bg-teal-500/30">
        <Header 
          user={user} 
          onLogout={handleLogout}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          onToggleHistory={async () => {
            try {
              // Toggle sidebar immediately
              setIsHistorySidebarOpen(prev => {
                const newState = !prev;
                // If opening, reload history in the background
                if (newState) {
                  getHistoryFromDb('gemini').then(geminiHistory => {
                    setHistory(geminiHistory);
                  }).catch(err => {
                    console.error('Failed to load Gemini history:', err);
                    setHistory([]);
                  });
                  getHistoryFromDb('wavespeed').then(wavespeedHistory => {
                    setWavespeedHistory(wavespeedHistory);
                  }).catch(err => {
                    console.error('Failed to load WaveSpeed history:', err);
                    setWavespeedHistory([]);
                  });
                }
                return newState;
              });
            } catch (error) {
              console.error('Error toggling history sidebar:', error);
              // Still toggle the sidebar even if history loading fails
              setIsHistorySidebarOpen(prev => !prev);
            }
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
        
        <div className="flex">
          <AppSidebar isOpen={isSidebarOpen} currentView={mainView} setView={setMainView} />
          
          <div className={`flex-grow pt-20 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'pl-20' : 'pl-0'}`}> {/* Offset for sidebar and header */}
            {mainView === 'halyxis' && (
              <main className="container mx-auto p-4 md:p-8 max-w-7xl">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    <div className="w-full lg:w-[380px] flex-shrink-0 flex flex-col gap-8">
                        <div className="bg-[#0f1115] border border-white/5 rounded-xl p-1.5 flex gap-1">
                            <TabButton
                                label="Reference"
                                isActive={mode === 'reference'}
                                onClick={() => handleModeChange('reference')}
                            />
                            <TabButton
                                label="Prompt"
                                isActive={mode === 'prompt'}
                                onClick={() => handleModeChange('prompt')}
                            />
                            <TabButton
                                label="Multi"
                                isActive={mode === 'multi'}
                                onClick={() => handleModeChange('multi')}
                            />
                        </div>
                        
                        {mode === 'multi' ? (
                          <div className="flex flex-col gap-6">
                              {multiPersonImages.map((image, index) => (
                                  <div key={index} className="relative group">
                                      <ImageUpload
                                          title={`Subject #${index + 1}`}
                                          ctaText="Click to upload"
                                          onImageUpload={(file) => handleMultiPersonImageUpload(file, index)}
                                          onPaste={() => handlePasteForMultiPersonImage(index)}
                                          image={image ? `data:${image.mimeType};base64,${image.base64}` : null}
                                      />
                                      {multiPersonImages.length > 1 && (
                                          <button
                                              onClick={() => handleRemovePersonSlot(index)}
                                              className="absolute top-2 right-2 bg-black/60 text-gray-400 rounded-full p-1.5 hover:bg-red-500 hover:text-white transition-colors backdrop-blur-sm"
                                              title="Remove Person"
                                          >
                                              <MinusCircleIcon className="w-5 h-5" />
                                          </button>
                                      )}
                                  </div>
                              ))}
                              <button
                                  onClick={handleAddPersonSlot}
                                  className="w-full border border-dashed border-gray-700 text-gray-400 font-medium py-4 rounded-xl hover:bg-white/5 hover:border-teal-500 hover:text-teal-400 transition-all text-xs uppercase tracking-widest"
                              >
                                  + Add Subject
                              </button>
                              <ImageUpload
                                  title="Upload Background (Optional)"
                                  ctaText="Upload background scene"
                                  onImageUpload={handleBackgroundImageUpload}
                                  onPaste={handlePasteForBackgroundImage}
                                  image={backgroundImageDataUrl}
                              />
                          </div>
                        ) : (
                          <div className="flex flex-col gap-6">
                              <ImageUpload
                                  title="1. Upload Person"
                                  ctaText="Upload subject"
                                  onImageUpload={handleImageUpload}
                                  onPaste={handlePasteForOriginalImage}
                                  image={originalImageDataUrl}
                              />
                              {mode === 'reference' && (
                                  <ImageUpload
                                      title="2. Upload Reference"
                                      ctaText="Upload style ref"
                                      onImageUpload={handleReferenceImageUpload}
                                      onPaste={handlePasteForReferenceImage}
                                      image={referenceImageDataUrl}
                                  />
                              )}
                               {mode === 'prompt' && (
                                  <ImageUpload
                                      title="Upload Background (Optional)"
                                      ctaText="Upload background scene"
                                      onImageUpload={handleBackgroundImageUpload}
                                      onPaste={handlePasteForBackgroundImage}
                                      image={backgroundImageDataUrl}
                                  />
                              )}
                          </div>
                        )}
                        
                        <PromptControls
                            prompt={prompt}
                            setPrompt={setPrompt}
                            onSubmit={handleSubmit}
                            isLoading={isLoading}
                            isReadyToGenerate={isReadyToGenerate}
                            aspectRatio={aspectRatio}
                            setAspectRatio={setAspectRatio}
                            mode={mode}
                        />
                    </div>
                    <div className="w-full flex-grow">
                        <ImageDisplay
                            generatedImage={generatedImage}
                            isLoading={isLoading}
                            error={error}
                            prompt={prompt}
                        />
                    </div>
                </div>
              </main>
            )}

            {mainView === 'halyxis+' && (
              <HalyxisPlusView />
            )}
          </div>
        </div>
        
        <HistorySidebar
          isOpen={isHistorySidebarOpen}
          onClose={() => setIsHistorySidebarOpen(false)}
          geminiHistory={history}
          wavespeedHistory={wavespeedHistory}
          onSelect={handleHistorySelect}
          onHistoryUpdate={(gemini, wavespeed) => {
            setHistory(gemini);
            setWavespeedHistory(wavespeed);
          }}
        />
        
        <CreatorSettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            userEmail={user.email}
        />
      </div>
    );
  }

  // Fallback for any unexpected state
  return null;
};

export default App;
