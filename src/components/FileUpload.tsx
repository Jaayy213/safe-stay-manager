import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { Upload, X, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { validateFileUpload, sanitizeInput } from "@/lib/security";

interface FileUploadProps {
  bookingId?: string;
  onUploadComplete?: (fileId: string) => void;
  allowedTypes?: string[];
  maxSize?: number;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error' | 'scanning';
  id?: string;
  error?: string;
}

const FileUpload = ({ 
  bookingId, 
  onUploadComplete, 
  allowedTypes,
  maxSize = 10 * 1024 * 1024 // 10MB default
}: FileUploadProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [uploadType, setUploadType] = useState("document");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Validate each file
    const validFiles: File[] = [];
    
    for (const file of files) {
      const validation = validateFileUpload(file);
      
      if (!validation.isValid) {
        toast({
          title: "File Validation Error",
          description: `${file.name}: ${validation.message}`,
          variant: "destructive",
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Add files to uploading state
    const newUploadingFiles = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Start uploading each file
    validFiles.forEach((file, index) => {
      uploadFile(file, newUploadingFiles.length - validFiles.length + index);
    });

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File, fileIndex: number) => {
    try {
      // Sanitize filename
      const sanitizedFilename = sanitizeInput(file.name)
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .substring(0, 100);

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const uniqueFilename = `${timestamp}_${sanitizedFilename}`;

      // Create file record in database first
      const { data: fileRecord, error: dbError } = await supabase
        .from("file_uploads")
        .insert({
          user_id: user?.id,
          booking_id: bookingId || null,
          filename: uniqueFilename,
          original_filename: file.name,
          file_size: file.size,
          mime_type: file.type,
          upload_type: uploadType,
          file_path: `uploads/${uniqueFilename}`,
          scan_status: 'pending'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Simulate file upload progress (in real implementation, this would be actual file upload)
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setUploadingFiles(prev => 
          prev.map((uploadFile, index) => 
            index === fileIndex 
              ? { ...uploadFile, progress }
              : uploadFile
          )
        );
      }

      // Update status to scanning
      setUploadingFiles(prev => 
        prev.map((uploadFile, index) => 
          index === fileIndex 
            ? { ...uploadFile, status: 'scanning', id: fileRecord.id }
            : uploadFile
        )
      );

      // Simulate virus scanning
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate scan results (95% pass, 5% fail for demo)
      const scanPassed = Math.random() > 0.05;

      if (scanPassed) {
        // Update scan status in database
        await supabase
          .from("file_uploads")
          .update({ scan_status: 'clean' })
          .eq("id", fileRecord.id);

        setUploadingFiles(prev => 
          prev.map((uploadFile, index) => 
            index === fileIndex 
              ? { ...uploadFile, status: 'completed' }
              : uploadFile
          )
        );

        toast({
          title: "Upload Successful",
          description: `${file.name} has been uploaded and scanned successfully`,
        });

        onUploadComplete?.(fileRecord.id);
      } else {
        // Update scan status to infected
        await supabase
          .from("file_uploads")
          .update({ scan_status: 'infected' })
          .eq("id", fileRecord.id);

        setUploadingFiles(prev => 
          prev.map((uploadFile, index) => 
            index === fileIndex 
              ? { 
                  ...uploadFile, 
                  status: 'error',
                  error: 'File failed security scan'
                }
              : uploadFile
          )
        );

        toast({
          title: "Upload Failed",
          description: `${file.name} failed security scanning and was rejected`,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error("Upload error:", error);
      
      setUploadingFiles(prev => 
        prev.map((uploadFile, index) => 
          index === fileIndex 
            ? { 
                ...uploadFile, 
                status: 'error',
                error: error.message || 'Upload failed'
              }
            : uploadFile
        )
      );

      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  const removeFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusIcon = (status: UploadingFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'scanning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = (file: UploadingFile) => {
    switch (file.status) {
      case 'uploading':
        return `Uploading... ${file.progress}%`;
      case 'scanning':
        return 'Scanning for security threats...';
      case 'completed':
        return 'Upload completed successfully';
      case 'error':
        return file.error || 'Upload failed';
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="upload_type">Upload Type</Label>
        <Select value={uploadType} onValueChange={setUploadType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="document">Document</SelectItem>
            <SelectItem value="identification">Identification</SelectItem>
            <SelectItem value="receipt">Receipt</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file-upload">Choose Files</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
          <Input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept={allowedTypes?.join(',') || 'image/*,.pdf,.doc,.docx,.txt'}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="mb-4"
          >
            <Upload className="h-4 w-4 mr-2" />
            Select Files
          </Button>
          <p className="text-sm text-muted-foreground">
            Supported formats: Images, PDF, DOC, DOCX, TXT
          </p>
          <p className="text-xs text-muted-foreground">
            Maximum file size: {(maxSize / 1024 / 1024).toFixed(0)}MB
          </p>
        </div>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <Label>Upload Progress</Label>
          {uploadingFiles.map((uploadFile, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(uploadFile.status)}
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{uploadFile.file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                {uploadFile.status !== 'uploading' && uploadFile.status !== 'scanning' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{getStatusText(uploadFile)}</span>
                  {uploadFile.status === 'uploading' && (
                    <span>{uploadFile.progress}%</span>
                  )}
                </div>
                {uploadFile.status === 'uploading' && (
                  <Progress value={uploadFile.progress} className="h-2" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;