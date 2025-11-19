import React, { useRef, useState } from "react";
import { Paperclip, X, Upload, AlertCircle } from "lucide-react";
import mediaUploadService from "../services/mediaUploadService";

const FileUpload = ({ onFileSelect, onRemoveFile, selectedFiles }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    const validFiles = [];

    fileArray.forEach((file) => {
      const validation = mediaUploadService.validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        alert(
          `File "${file.name}" is invalid: ${validation.errors.join(", ")}`
        );
      }
    });

    if (validFiles.length > 0) {
      onFileSelect(validFiles);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index) => {
    onRemoveFile(index);
  };

  const getFilePreview = (file) => {
    if (file.type.startsWith("image/")) {
      return (
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          className="w-12 h-12 object-cover rounded"
        />
      );
    }

    return (
      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
        <span className="text-lg">
          {mediaUploadService.getFileIcon(file.type)}
        </span>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Upload Button */}
      <button
        onClick={handleClick}
        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
        title="Attach files"
      >
        <Paperclip size={20} />
      </button>

      {/* Drag & Drop Area */}
      {dragActive && (
        <div
          className="fixed inset-0 bg-blue-500/20 flex items-center justify-center z-50"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <Upload size={48} className="mx-auto mb-4 text-blue-500" />
            <p className="text-lg font-medium">Drop files here to upload</p>
            <p className="text-sm text-gray-500">
              Images, videos, audio, and documents
            </p>
          </div>
        </div>
      )}

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-80">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Selected Files</h4>
            <button
              onClick={() => onRemoveFile("all")}
              className="text-gray-400 hover:text-red-500"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 p-2 bg-gray-50 rounded"
              >
                {getFilePreview(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {mediaUploadService.formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Upload Progress */}
          {Object.keys(uploadProgress).length > 0 && (
            <div className="mt-2 space-y-1">
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{progress}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
