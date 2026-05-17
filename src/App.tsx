import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Download, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
      setGeneratedUrl(null);
      setError(null);
      
      generateImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));
        setGeneratedUrl(null);
        setError(null);
        
        generateImage(file);
      } else {
        setError("Please drop a valid image file.");
      }
    }
  };

  const generateImage = async (fileToProcess: File) => {
    if (!fileToProcess) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedUrl(null);

    const formData = new FormData();
    formData.append('image', fileToProcess);

    try {
      const response = await fetch('/api/maker/thejansen', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setGeneratedUrl(objectUrl);
    } catch (err: any) {
      setError(err.message || 'An error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (generatedUrl) URL.revokeObjectURL(generatedUrl);
    setGeneratedUrl(null);
    setError(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans p-4 items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-neutral-200">
        <div className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">The Jansen PP Maker</h1>
            <p className="mt-2 text-sm text-neutral-500">Ubah foto kamu dan jadikan ala cover The Jansen</p>
          </div>

          <div id="container-9a87b1637c7c86487588d6df64e414e6" className="w-full flex justify-center mb-6"></div>

          <AnimatePresence mode="wait">
            {!previewUrl && !generatedUrl && !isGenerating && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center py-12 px-6 border-2 border-neutral-300 border-dashed rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors group"
                >
                  <UploadCloud className="w-12 h-12 text-neutral-400 group-hover:text-indigo-500 mb-4 transition-colors" />
                  <p className="text-sm font-medium text-neutral-700">Click to upload or drag and drop</p>
                  <p className="text-xs text-neutral-500 mt-1">PNG, JPG up to 5MB</p>
                </div>
              </motion.div>
            )}

            {(isGenerating || generatedUrl) && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                 <div className="relative w-full aspect-square bg-neutral-100 rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-neutral-200">
                    {isGenerating ? (
                        <div className="flex flex-col items-center text-indigo-600">
                            <Loader2 className="w-10 h-10 animate-spin mb-3" />
                            <p className="text-sm font-medium animate-pulse">Memproses foto...</p>
                        </div>
                    ) : generatedUrl ? (
                         <img 
                          src={generatedUrl} 
                          alt="Hasil The Jansen" 
                          className="w-full h-full object-contain"
                        />
                    ) : null}
                 </div>

                 {generatedUrl && (
                     <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
                         <a
                          href={generatedUrl}
                          download="the-jansen-pp.jpg"
                          className="flex-1 flex items-center justify-center py-3 px-4 bg-indigo-600 text-white text-sm font-medium rounded-xl shadow hover:bg-indigo-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Foto
                        </a>
                        <button
                          onClick={resetState}
                          className="flex-1 flex items-center justify-center py-3 px-4 bg-white text-neutral-700 border border-neutral-300 text-sm font-medium rounded-xl shadow-sm hover:bg-neutral-50 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Buat Lagi
                        </button>
                     </div>
                 )}
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
               initial={{ opacity: 0, mt: 0 }}
               animate={{ opacity: 1, mt: 16 }}
               className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 mt-4 text-center"
            >
              {error}
              <button onClick={resetState} className="ml-2 underline font-medium hover:text-red-800">Coba lagi</button>
            </motion.div>
          )}

          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileSelect}
          />
          
          <div className="mt-8 text-center">
            <a 
              href="https://spreadpreferencetelevision.com/sj0mn37s5?key=2f2cd0c2a574426f973ac53564df04fb" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-neutral-400 hover:text-indigo-600 transition-colors inline-block"
            >
              Support Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
