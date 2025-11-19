import { supabase } from "../../../config/env";

class MediaUploadService {
  constructor() {
    this.bucketName = "chat-media";
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    this.allowedVideoTypes = ["video/mp4", "video/webm", "video/ogg"];
    this.allowedAudioTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/mp4",
    ];
    this.allowedFileTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "application/zip",
      "application/x-rar-compressed",
    ];
  }

  // Get file type category
  getFileTypeCategory(file) {
    if (this.allowedImageTypes.includes(file.type)) return "image";
    if (this.allowedVideoTypes.includes(file.type)) return "video";
    if (this.allowedAudioTypes.includes(file.type)) return "audio";
    if (this.allowedFileTypes.includes(file.type)) return "file";
    return "file"; // default to file
  }

  // Validate file
  validateFile(file) {
    const errors = [];

    if (file.size > this.maxFileSize) {
      errors.push(
        `File size must be less than ${this.maxFileSize / (1024 * 1024)}MB`
      );
    }

    const allowedTypes = [
      ...this.allowedImageTypes,
      ...this.allowedVideoTypes,
      ...this.allowedAudioTypes,
      ...this.allowedFileTypes,
    ];

    if (!allowedTypes.includes(file.type)) {
      errors.push("File type not supported");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Generate unique filename
  generateFileName(file, conversationId) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split(".").pop();
    return `${conversationId}/${timestamp}_${randomString}.${extension}`;
  }

  // Upload file to Supabase storage
  async uploadFile(file, conversationId) {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      const fileTypeCategory = this.getFileTypeCategory(file);
      const fileName = this.generateFileName(file, conversationId);
      const filePath = `${fileTypeCategory}/${fileName}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return {
        success: true,
        data: {
          url: urlData.publicUrl,
          path: filePath,
          name: file.name,
          size: file.size,
          type: file.type,
          category: fileTypeCategory,
        },
      };
    } catch (error) {
      console.error("Upload error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generate thumbnail for videos (placeholder - you might want to use a video processing service)
  async generateVideoThumbnail(videoFile) {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      video.onloadedmetadata = () => {
        video.currentTime = 1; // Seek to 1 second
      };

      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          "image/jpeg",
          0.8
        );
      };

      video.src = URL.createObjectURL(videoFile);
    });
  }

  // Upload video with thumbnail
  async uploadVideoWithThumbnail(videoFile, conversationId) {
    try {
      // Upload video
      const videoUpload = await this.uploadFile(videoFile, conversationId);
      if (!videoUpload.success) {
        throw new Error(videoUpload.error);
      }

      // Generate and upload thumbnail
      const thumbnailBlob = await this.generateVideoThumbnail(videoFile);
      const thumbnailFile = new File([thumbnailBlob], "thumbnail.jpg", {
        type: "image/jpeg",
      });

      const thumbnailUpload = await this.uploadFile(
        thumbnailFile,
        conversationId
      );
      if (!thumbnailUpload.success) {
        console.warn("Thumbnail upload failed:", thumbnailUpload.error);
      }

      return {
        success: true,
        data: {
          ...videoUpload.data,
          thumbnailUrl: thumbnailUpload.success
            ? thumbnailUpload.data.url
            : null,
        },
      };
    } catch (error) {
      console.error("Video upload error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Delete file from storage
  async deleteFile(filePath) {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Delete error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Get file icon based on type
  getFileIcon(fileType) {
    if (this.allowedImageTypes.includes(fileType)) return "🖼️";
    if (this.allowedVideoTypes.includes(fileType)) return "🎥";
    if (this.allowedAudioTypes.includes(fileType)) return "🎵";
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word")) return "📝";
    if (fileType.includes("excel") || fileType.includes("spreadsheet"))
      return "📊";
    if (fileType.includes("zip") || fileType.includes("rar")) return "📦";
    return "📎";
  }
}

export default new MediaUploadService();
