import { useState, useEffect, useContext } from "react";
import { supabase } from "../../../config/env";
import { OrgContext } from "../../../context/contexts";

const AICustomization = () => {
  const { orgState } = useContext(OrgContext);
  const [aiData, setAIData] = useState(null);
  const [greeting, setGreeting] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(null);

  // Fetch AI data on component mount
  useEffect(() => {
    const fetchAIData = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("ai")
          .select("*")
          .eq("company_id", orgState?.id)
          .single();

        if (error) throw error;

        setAIData(data);
        setGreeting(data.greeting);
      } catch (error) {
        console.error("Error fetching AI data:", error);
        alert("Failed to load AI configuration");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAIData();
  }, []);

  // Save greeting update
  const handleSaveGreeting = async () => {
    if (!greeting.trim()) {
      alert("Greeting cannot be empty");
      return;
    }

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from("ai")
        .update({ greeting })
        .eq("company_id", orgState?.id);

      if (error) throw error;

      setStatus(true);
      setTimeout(() => {
        setStatus(false);
      }, 4000);
    } catch (error) {
      console.error("Error updating greeting:", error);
      alert("Failed to update greeting");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6">Customize AI</h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="greeting"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Initial Greeting
            </label>
            <textarea
              id="greeting"
              name="greeting"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              rows="3"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition
                    border-gray-300`}
              placeholder="Hello! I'm your AI assistant. How can I help you today?"
            />
            <p className="mt-1 text-sm text-gray-500">
              This is what your AI will say at the beginning of a conversation.
            </p>
          </div>

          <div>
            <label
              htmlFor="prompt"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              AI Prompt
            </label>
            <textarea
              id="prompt"
              name="prompt"
              disabled
              value={aiData?.prompt}
              rows="5"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition
                    border-gray-300`}
              placeholder={`You are a helpful assistant for ${orgState.name}. Your goal is to assist customers with their inquiries, provide information about properties, and guide them through the booking process.`}
            />
            <p className="mt-1 text-sm text-gray-500">
              This prompt will guide how your AI interacts with customers.
            </p>
          </div>

          <button
            onClick={handleSaveGreeting}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      {status && (
        <div className="fixed bottom-10 shadow-sm right-10 mt-2 p-3 px-6 bg-green-100 text-green-700 rounded-md">
          <p className="text-sm">Saved Successfully!</p>
        </div>
      )}
    </>
  );
};

export default AICustomization;
