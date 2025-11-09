import { useState, useEffect, useContext } from "react";
import {
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  ImagePlus,
  Check,
  ArrowLeft,
  Loader,
} from "lucide-react";
import { supabase } from "../../../config/env";
import { InstituteContext } from "../../../context/contexts";

// Main Gallery Component
export default function Gallery() {
  const { instituteState } = useContext(InstituteContext);
  const [galleries, setGalleries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Mock galleries data for demonstration
  useEffect(() => {
    fetchGalleries();
  }, []);

  const fetchGalleries = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from("galleries")
        .select("*")
        .eq("institute_id", instituteState.id);
      console.log(data);
      setGalleries(data || []);
    } catch (error) {
      console.error("Error fetching galleries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createGallery = async (title) => {
    try {
      const { data } = await supabase.from("galleries").insert([
        {
          title,
          images: [],
          institute_id: instituteState.id,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
      await fetchGalleries();
      return data[0];
    } catch (error) {
      console.error("Error creating gallery:", error);
    }
  };

  const updateGallery = async (id, title) => {
    try {
      await supabase
        .from("galleries")
        .update({ title, updated_at: new Date() })
        .eq("id", id);

      setGalleries(
        galleries.map((gallery) =>
          gallery.id === id
            ? { ...gallery, title, updated_at: new Date() }
            : gallery
        )
      );
    } catch (error) {
      console.error("Error updating gallery:", error);
    }
  };

  const deleteGallery = async (id) => {
    try {
      const galleryToDelete = galleries.find((g) => g.id === id);
      if (galleryToDelete && galleryToDelete.images) {
        // Delete all images from storage
        const imagePaths = galleryToDelete.images.map((img) => img.path);
        if (imagePaths.length > 0) {
          await supabase.storage.from("gallery-images").remove(imagePaths);
        }
      }

      // Delete gallery
      await supabase.from("galleries").delete().eq("id", id);
      setGalleries(galleries.filter((gallery) => gallery.id !== id));
    } catch (error) {
      console.error("Error deleting gallery:", error);
    }
  };

  const uploadImage = async (galleryId, file) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${galleryId}/${fileName}`;

      // Upload to storage
      const { data: uploadData } = await supabase.storage
        .from("gallery-images")
        .upload(filePath, file);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("gallery-images")
        .getPublicUrl(filePath);

      const newImage = {
        id: Date.now().toString(),
        url: urlData.publicUrl,
        path: filePath,
        caption: file.name,
        isThumbnail: false,
      };

      // Get current gallery
      const gallery = galleries.find((g) => g.id === galleryId);
      const updatedImages = [...(gallery.images || []), newImage];

      // If this is the first image, set it as thumbnail
      if (updatedImages.length === 1) {
        updatedImages[0].isThumbnail = true;
      }

      // Update gallery in database
      await supabase
        .from("galleries")
        .update({
          images: updatedImages,
          updated_at: new Date(),
        })
        .eq("id", galleryId);

      // Update state
      setGalleries(
        galleries.map((gallery) => {
          if (gallery.id === galleryId) {
            return {
              ...gallery,
              images: updatedImages,
              updated_at: new Date(),
            };
          }
          return gallery;
        })
      );

      return newImage;
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const deleteImage = async (galleryId, imageId) => {
    try {
      const gallery = galleries.find((g) => g.id === galleryId);
      const imageToDelete = gallery.images.find((img) => img.id === imageId);
      const wasThumbnail = imageToDelete.isThumbnail;

      // Remove from storage
      if (imageToDelete.path) {
        await supabase.storage
          .from("gallery-images")
          .remove([imageToDelete.path]);
      }

      // Update images array
      let updatedImages = gallery.images.filter((img) => img.id !== imageId);

      // If we deleted the thumbnail and there are other images, set a new thumbnail
      if (wasThumbnail && updatedImages.length > 0) {
        updatedImages[0].isThumbnail = true;
      }

      // Update gallery in database
      await supabase
        .from("galleries")
        .update({
          images: updatedImages,
          updated_at: new Date(),
        })
        .eq("id", galleryId);

      // Update state
      setGalleries(
        galleries.map((gallery) => {
          if (gallery.id === galleryId) {
            return {
              ...gallery,
              images: updatedImages,
              updated_at: new Date(),
            };
          }
          return gallery;
        })
      );
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  const setThumbnail = async (galleryId, imageId) => {
    try {
      const gallery = galleries.find((g) => g.id === galleryId);
      const updatedImages = gallery.images.map((img) => ({
        ...img,
        isThumbnail: img.id === imageId,
      }));

      // Update gallery in database
      await supabase
        .from("galleries")
        .update({
          images: updatedImages,
          updated_at: new Date(),
        })
        .eq("id", galleryId);

      // Update state
      setGalleries(
        galleries.map((gallery) => {
          if (gallery.id === galleryId) {
            return {
              ...gallery,
              images: updatedImages,
              updated_at: new Date(),
            };
          }
          return gallery;
        })
      );
    } catch (error) {
      console.error("Error setting thumbnail:", error);
    }
  };

  const openGallery = (gallery) => {
    setSelectedGallery(gallery);
    setShowSlideshow(true);
    setCurrentSlide(0);
  };

  return (
    <div className="container mx-auto p-4">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
          <p className="ml-2 text-lg text-gray-600">Loading galleries...</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">My Galleries</h1>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-5 h-5 mr-1" />
              Create Gallery
            </button>
          </div>

          {galleries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 mb-4">No galleries found</p>
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-5 h-5 mr-1" />
                Create your first gallery
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleries.map((gallery, index) => (
                <GalleryCard
                  key={gallery.id}
                  gallery={gallery}
                  index={index}
                  openGallery={openGallery}
                  updateGallery={updateGallery}
                  deleteGallery={deleteGallery}
                  uploadImage={uploadImage}
                  setThumbnail={setThumbnail}
                />
              ))}
            </div>
          )}

          {/* Create Gallery Modal */}
          {showCreateModal && (
            <CreateGalleryModal
              onClose={() => setShowCreateModal(false)}
              onCreate={createGallery}
            />
          )}

          {/* Image Slideshow Modal */}
          {showSlideshow && selectedGallery && (
            <SlideshowModal
              gallery={selectedGallery}
              currentSlide={currentSlide}
              setCurrentSlide={setCurrentSlide}
              onClose={() => setShowSlideshow(false)}
              deleteImage={(imageId) =>
                deleteImage(selectedGallery.id, imageId)
              }
              setThumbnail={setThumbnail}
            />
          )}
        </>
      )}
    </div>
  );
}

// Gallery Card Component
function GalleryCard({
  gallery,
  index,
  openGallery,
  updateGallery,
  deleteGallery,
  uploadImage,
  setThumbnail,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(gallery.title);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Determine card size based on index for masonry layout effect
  const isLarge = index % 5 === 0 || index % 5 === 3;

  const handleUpdate = () => {
    updateGallery(gallery.id, title);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this gallery?")) {
      deleteGallery(gallery.id);
    }
  };

  const handleImageUpload = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadImage(gallery.id, e.target.files[0]);
      setShowUploadForm(false);
    }
  };

  const thumbnailImage =
    gallery.images?.find((img) => img.isThumbnail) || gallery.images?.[0];

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${
        isLarge ? "row-span-2" : ""
      }`}
    >
      <div
        className="relative cursor-pointer"
        onClick={() =>
          gallery.images && gallery.images.length > 0
            ? openGallery(gallery)
            : null
        }
      >
        {thumbnailImage ? (
          <img
            src={thumbnailImage.url}
            alt={gallery.title}
            className={`w-full object-cover ${isLarge ? "h-72" : "h-48"}`}
          />
        ) : (
          <div
            className={`bg-gray-200 flex items-center justify-center ${
              isLarge ? "h-72" : "h-48"
            }`}
          >
            <p className="text-gray-500">No images</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
          {!isEditing ? (
            <h3 className="text-white text-lg font-semibold mb-1">
              {gallery.title}
            </h3>
          ) : (
            <div className="flex items-center mb-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white/90 text-gray-800 px-2 py-1 rounded w-full"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdate();
                }}
                className="ml-2 bg-green-500 hover:bg-green-600 text-white p-1 rounded"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          )}
          <p className="text-white text-sm">
            {gallery.images ? gallery.images.length : 0} images
          </p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              className="text-gray-600 hover:text-blue-600 p-1"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              className="text-gray-600 hover:text-red-600 p-1"
              onClick={handleDelete}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
          <button
            className="text-blue-600 hover:text-blue-800 flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              setShowUploadForm(!showUploadForm);
            }}
          >
            <ImagePlus className="w-5 h-5 mr-1" />
            Add Image
          </button>
        </div>

        {showUploadForm && (
          <div
            className="mt-4 p-3 bg-gray-100 rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Create Gallery Modal
function CreateGalleryModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsCreating(true);
    await onCreate(title);
    setIsCreating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b p-4">
          <h3 className="text-lg font-semibold">Create New Gallery</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label
              htmlFor="gallery-title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Gallery Title
            </label>
            <input
              id="gallery-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter gallery title"
              autoFocus
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isCreating}
              className={`px-4 py-2 rounded-md text-white ${
                !title.trim() || isCreating
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isCreating ? (
                <div className="flex items-center">
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Creating...
                </div>
              ) : (
                "Create Gallery"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Slideshow Modal
function SlideshowModal({
  gallery,
  currentSlide,
  setCurrentSlide,
  onClose,
  deleteImage,
  setThumbnail,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % gallery.images.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + gallery.images.length) % gallery.images.length
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight") nextSlide();
    if (e.key === "ArrowLeft") prevSlide();
    if (e.key === "Escape") onClose();
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gallery.images.length]);

  const handleDeleteImage = () => {
    if (confirm("Are you sure you want to delete this image?")) {
      deleteImage(gallery.images[currentSlide].id);
      if (gallery.images.length === 1) {
        onClose();
      } else {
        setCurrentSlide(Math.min(currentSlide, gallery.images.length - 2));
      }
    }
  };

  const handleSetThumbnail = () => {
    setThumbnail(gallery.id, gallery.images[currentSlide].id);
  };

  if (!gallery.images || gallery.images.length === 0) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/85 z-50 flex flex-col ${
        isFullscreen ? "p-0" : "p-4 md:p-8"
      }`}
    >
      {/* Header */}
      <div
        className={`flex justify-between items-center text-white ${
          isFullscreen
            ? "p-4 bg-black/60 absolute top-0 left-0 right-0 z-10"
            : "mb-4"
        }`}
      >
        <div className="flex items-center">
          <button onClick={onClose} className="mr-4 hover:text-gray-300">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-semibold">{gallery.title}</h2>
        </div>
        <div className="text-sm">
          {currentSlide + 1} / {gallery.images.length}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Navigation buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-4 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-4 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Image container */}
        <div
          className="h-full w-full flex items-center justify-center cursor-pointer"
          onClick={() => setIsFullscreen(!isFullscreen)}
        >
          <img
            src={gallery.images[currentSlide].url}
            alt={
              gallery.images[currentSlide].caption ||
              `Image ${currentSlide + 1}`
            }
            className={`max-h-full max-w-full object-contain ${
              isFullscreen ? "" : "rounded-lg shadow-lg"
            }`}
          />
        </div>
      </div>

      {/* Footer */}
      <div
        className={`mt-4 flex justify-between items-center text-white ${
          isFullscreen
            ? "p-4 bg-black/60 absolute bottom-0 left-0 right-0 z-10"
            : ""
        }`}
      >
        <p className="text-sm">
          {gallery.images[currentSlide].caption || `Image ${currentSlide + 1}`}
        </p>
        <div className="flex space-x-4">
          <button
            onClick={handleSetThumbnail}
            className={`text-white hover:text-blue-400 flex items-center ${
              gallery.images[currentSlide].isThumbnail ? "text-blue-400" : ""
            }`}
          >
            <ImagePlus className="w-5 h-5 mr-1" />
            {gallery.images[currentSlide].isThumbnail
              ? "Current Thumbnail"
              : "Set as Thumbnail"}
          </button>
          <button
            onClick={handleDeleteImage}
            className="text-red-500 hover:text-red-400 flex items-center"
          >
            <Trash2 className="w-5 h-5 mr-1" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
