import React, { useState } from "react";
import { Download, Play, Pause, Volume2, X, Maximize2 } from "lucide-react";
import mediaUploadService from "../services/mediaUploadService";

const MediaMessage = ({ message, isOwnMessage }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [videoRef, setVideoRef] = useState(null);

  const handleVideoPlayPause = () => {
    if (videoRef) {
      if (isPlaying) {
        videoRef.pause();
      } else {
        videoRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = message.media_url;
    link.download = message.media_name || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadFile = (file) => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePlayAudio = (file) => {
    // Create audio element and play
    const audio = new Audio(file.url);
    audio.play().catch((error) => {
      console.error("Error playing audio:", error);
    });
  };

  const renderImage = () => (
    <div className="relative group">
      <img
        src={message.media_url}
        alt={message.message_text || "Image"}
        className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => setShowFullImage(true)}
      />
      <button
        onClick={() => setShowFullImage(true)}
        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Maximize2 size={16} />
      </button>
    </div>
  );

  const renderVideo = () => (
    <div className="relative group">
      <video
        ref={setVideoRef}
        src={message.media_url}
        poster={message.thumbnail_url}
        className="max-w-xs rounded-lg"
        onEnded={handleVideoEnded}
        controls
      />
      <div className="absolute bottom-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handleDownload}>
          <Download size={16} />
        </button>
      </div>
    </div>
  );

  const renderAudio = () => (
    <div className="flex items-center space-x-2 bg-gray-100 p-3 rounded-lg">
      <button
        onClick={handleVideoPlayPause}
        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <div className="flex-1">
        <p className="text-sm font-medium">{message.media_name}</p>
        <p className="text-xs text-gray-500">
          {mediaUploadService.formatFileSize(message.media_size)}
        </p>
      </div>
      <button
        onClick={handleDownload}
        className="text-gray-500 hover:text-gray-700"
      >
        <Download size={16} />
      </button>
    </div>
  );

  const renderFile = () => (
    <div className="flex items-center space-x-3 bg-gray-100 p-3 rounded-lg">
      <div className="text-2xl">
        {mediaUploadService.getFileIcon(message.media_type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{message.media_name}</p>
        <p className="text-xs text-gray-500">
          {mediaUploadService.formatFileSize(message.media_size)}
        </p>
      </div>
      <button
        onClick={handleDownload}
        className="text-gray-500 hover:text-gray-700"
      >
        <Download size={16} />
      </button>
    </div>
  );

  const renderMediaGroup = () => {
    const mediaFiles = message.metadata?.mediaFiles || [];

    if (mediaFiles.length === 0) return null;

    return (
      <div className="space-y-2">
        {mediaFiles.map((file, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-2">
            {file.category === "image" && (
              <div className="relative group">
                <img
                  src={file.url}
                  alt={file.name}
                  className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setShowFullImage(true)}
                />
                <button
                  onClick={() => setShowFullImage(true)}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Maximize2 size={16} />
                </button>
              </div>
            )}

            {file.category === "video" && (
              <div className="relative group">
                <video
                  src={file.url}
                  poster={file.thumbnailUrl}
                  className="max-w-xs rounded-lg"
                  controls
                />
                <div className="absolute bottom-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDownloadFile(file)}>
                    <Download size={16} />
                  </button>
                </div>
              </div>
            )}

            {file.category === "audio" && (
              <div className="flex items-center space-x-2 bg-gray-100 p-3 rounded-lg">
                <button
                  onClick={() => handlePlayAudio(file)}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                >
                  <Play size={16} />
                </button>
                <div className="flex-1">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {mediaUploadService.formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadFile(file)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Download size={16} />
                </button>
              </div>
            )}

            {file.category === "file" && (
              <div className="flex items-center space-x-3 bg-gray-100 p-3 rounded-lg">
                <div className="text-2xl">
                  {mediaUploadService.getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {mediaUploadService.formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadFile(file)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Download size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderMedia = () => {
    switch (message.message_type) {
      case "image":
        return renderImage();
      case "video":
        return renderVideo();
      case "audio":
        return renderAudio();
      case "file":
        return renderFile();
      case "media_group":
        return renderMediaGroup();
      default:
        return null;
    }
  };

  return (
    <>
      <div className="space-y-2">
        {message.message_text && (
          <p className="text-sm">{message.message_text}</p>
        )}
        {renderMedia()}
      </div>

      {/* Full Image Modal */}
      {showFullImage && message.message_type === "image" && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-full p-4">
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <X size={20} />
            </button>
            <img
              src={message.media_url}
              alt={message.message_text || "Image"}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default MediaMessage;
