import { useState, useEffect, useContext, useRef } from "react";
import {
  Plus,
  Image as ImageIcon,
  X,
  Edit,
  Trash2,
  Send,
  Clock,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../../../config/env";
import { InstituteContext } from "../../../context/contexts";

const News = () => {
  const { instituteState } = useContext(InstituteContext);
  const [news, setNews] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: null,
    imagePreview: null,
  });

  const fileInputRef = useRef(null);

  // Fetch news from Supabase
  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("institute_id", instituteState.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error("Error fetching news:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [instituteState.id]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image: null,
      imagePreview: null,
    });
    setEditingId(null);
    setShowForm(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Upload image to Supabase Storage
  const uploadImage = async (file) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()
      .toString(36)
      .substring(2, 15)}.${fileExt}`;
    const filePath = `${instituteState.id}/${fileName}`;

    const { data, error } = await supabase.storage
      .from("news-images")
      .upload(filePath, file);

    if (error) throw error;

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("news-images")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;

    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (formData.image) {
        imageUrl = await uploadImage(formData.image);
      }

      if (editingId) {
        // Update existing news
        const { error } = await supabase
          .from("news")
          .update({
            title: formData.title,
            description: formData.description,
            image_url:
              imageUrl || news.find((item) => item.id === editingId)?.image_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId);

        if (error) throw error;
      } else {
        // Insert new news
        const { error } = await supabase.from("news").insert({
          institute_id: instituteState.id,
          title: formData.title,
          description: formData.description,
          image_url: imageUrl,
        });

        if (error) throw error;
      }

      // Refresh news list
      await fetchNews();
      resetForm();
    } catch (error) {
      console.error("Error saving news:", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit news
  const handleEdit = (newsItem) => {
    setFormData({
      title: newsItem.title,
      description: newsItem.description,
      image: null,
      imagePreview: newsItem.image_url,
    });
    setEditingId(newsItem.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle delete news
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this news item?")) return;

    try {
      // Get the news item to delete
      const newsToDelete = news.find((item) => item.id === id);

      // Delete the news entry
      const { error } = await supabase.from("news").delete().eq("id", id);

      if (error) throw error;

      // Delete the image from storage if it exists
      if (newsToDelete.image_url) {
        const imagePath = newsToDelete.image_url.split("/").pop();
        await supabase.storage
          .from("news-images")
          .remove([`${instituteState.id}/${imagePath}`]);
      }

      // Refresh news list
      await fetchNews();
    } catch (error) {
      console.error("Error deleting news:", error.message);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Load more news
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 5);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Create News Button */}
      {!showForm && !editingId && (
        <div className="mb-8">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
          >
            <Plus size={18} className="mr-1" />
            Create News
          </button>
        </div>
      )}

      {/* News Creation Form */}
      {(showForm || editingId) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 relative">
          <button
            onClick={resetForm}
            className="absolute top-4 right-4 p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
          <h2 className="text-xl font-semibold mb-4 pr-8">
            {editingId ? "Edit News" : "Create News"}
          </h2>
          <form onSubmit={handleSubmit}>
            {/* Title Input */}
            <div className="mb-4">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="News title"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Description Input */}
            <div className="mb-4">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="What's new?"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-32"
                required
              />
            </div>

            {/* Image Preview */}
            {formData.imagePreview && (
              <div className="relative mb-4">
                <img
                  src={formData.imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      image: null,
                      imagePreview: null,
                    }))
                  }
                  className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white p-1 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="flex items-center text-gray-600 hover:text-blue-600 mr-4"
                >
                  <ImageIcon size={20} className="mr-1" />
                  <span>Add Image</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="flex space-x-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {isSubmitting ? (
                    "Saving..."
                  ) : (
                    <>
                      <Send size={18} className="mr-1" />
                      {editingId ? "Update" : "Post"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* News Feed */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold mb-4">Latest News</h2>

        {isLoading ? (
          <div className="text-center py-6">Loading news...</div>
        ) : news.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <p className="text-gray-500">
              No news available. Be the first to post!
            </p>
          </div>
        ) : (
          <>
            {news.slice(0, visibleCount).map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg  border border-gray-200 overflow-hidden"
              >
                {/* News Header */}
                <div className="p-4 flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="text-gray-500 text-xs mt-1 flex items-center">
                      <Clock size={12} className="mr-1" />
                      {formatDate(item.created_at)}
                    </p>
                  </div>

                  {/* Actions Dropdown */}
                  <div className="relative">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* News Content */}
                <div className="px-4 pb-4">
                  <p className="text-gray-700 mb-4 whitespace-pre-line">
                    {item.description}
                  </p>

                  {/* News Image */}
                  {item.image_url && (
                    <div className="mb-4">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full max-h-96 object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {news.length > visibleCount && (
              <div className="text-center">
                <button
                  onClick={handleLoadMore}
                  className="flex items-center justify-center mx-auto px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
                >
                  <span>Show More</span>
                  <ChevronDown size={18} className="ml-1" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default News;
