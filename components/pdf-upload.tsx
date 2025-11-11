'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase/client';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PdfUploadProps {
  onUploadComplete: (fileUrl: string, fileName: string) => void;
  currentFileUrl?: string;
}

export function PdfUpload({ onUploadComplete, currentFileUrl }: PdfUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please select a PDF file',
        variant: 'destructive',
      });
      return false;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'PDF must be smaller than 10MB',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a PDF file first',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('reports')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('reports')
        .getPublicUrl(filePath);

      toast({
        title: 'Upload successful',
        description: 'PDF has been uploaded successfully',
      });

      onUploadComplete(urlData.publicUrl, selectedFile.name);
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      <Label>Upload PDF Report</Label>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 hover:border-slate-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        {!selectedFile ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-slate-100 rounded-full">
                <Upload className="h-8 w-8 text-slate-600" />
              </div>
            </div>
            <div>
              <p className="text-slate-700 font-medium mb-1">
                Drop your PDF here, or click to browse
              </p>
              <p className="text-sm text-slate-500">Maximum file size: 10MB</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Select PDF File
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-blue-100 rounded">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {currentFileUrl && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <span className="font-medium">Current file uploaded:</span> PDF is ready
            for partners to view and download
          </p>
        </div>
      )}
    </div>
  );
}
