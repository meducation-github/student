import { useState, useEffect, useContext } from "react";
import { supabase } from "../../../config/env";
import { OrgContext, UserContext } from "../../../context/contexts";

const Scrape = () => {
  const { userState } = useContext(UserContext);
  const { orgState } = useContext(OrgContext);
  const [scrapeLink, setScrapeLink] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(null);

  // Fetch AI data on component mount
  useEffect(() => {
    const fetchAIData = async () => {
      try {
        setIsLoading(true);

        const { data: user, error } = await supabase
          .from("users")
          .select("*")
          .eq("user_id", userState?.id)
          .single();

        const { data: companyData, error2 } = await supabase
          .from("company")
          .select("*")
          .eq("id", user?.company_id)
          .single();

        if (error) throw error;
        if (error2) throw error2;

        setScrapeLink(companyData?.website_url);
      } catch (error) {
        console.error("Error fetching AI data:", error);
        // alert("Failed to load AI configuration");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAIData();
  }, []);

  // Save greeting update
  const handleSaveGreeting = async () => {
    if (!scrapeLink.trim()) {
      alert("Greeting cannot be empty");
      return;
    }

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from("company")
        .update({ website_url: scrapeLink })
        .eq("id", orgState?.id);

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
        <h2 className="text-xl font-bold mb-6">Scrape</h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="scrapeLink"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Website URL
            </label>
            <input
              id="scrapeLink"
              name="scrapeLink"
              value={scrapeLink}
              onChange={(e) => setScrapeLink(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition
                    border-gray-300`}
              placeholder="https://example.com"
            />
            <p className="mt-1 text-sm text-gray-500">
              The link to scrape data
            </p>
          </div>

          <button
            onClick={handleSaveGreeting}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {isSaving ? "Updating..." : "Update"}
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

export default Scrape;
