import { useContext, useEffect, useState } from "react";
import { supabase } from "../../../config/env";
import PropTypes from "prop-types";
import { InstituteContext, UserContext } from "../../../context/contexts";
import { User, Calendar, Mail } from "lucide-react";
import { FaBuilding } from "react-icons/fa";

export default function AccountDetails() {
  const { instituteState } = useContext(InstituteContext);
  const { userState } = useContext(UserContext);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    country: "",
    role: "",
    created_at: "",
    last_sign_in: "",
    phone: "",
    confirmed_at: "",
  });
  const [loading, setLoading] = useState(true);

  // Fetch current user profile
  useEffect(() => {
    const getProfile = async () => {
      if (!userState) return;

      try {
        setLoading(true);

        // Fetch additional user details from Supabase
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("user_id", userState.id)
          .single();

        if (error) throw error;

        // Combine auth user details with database user details
        setProfile({
          name: data.name || userState.user_metadata?.full_name || "N/A",
          email: userState.email || "N/A",
          country: data.country || "N/A",
          role: data.role || "User",
          created_at: new Date(userState.created_at).toLocaleString(),
          last_sign_in: userState.last_sign_in_at
            ? new Date(userState.last_sign_in_at).toLocaleString()
            : "N/A",
          phone: userState.phone || "N/A",
          confirmed_at: userState.confirmed_at
            ? new Date(userState.confirmed_at).toLocaleString()
            : "N/A",
        });
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [userState]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">My Account</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information Section */}
        <div className="bg-gray-50 p-5 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b border-gray-200 pb-2">
            Personal Details
          </h3>
          <div className="space-y-4">
            <DetailRow
              icon={<User className="text-blue-500 mr-3" size={20} />}
              label="Full Name"
              value={profile.name}
            />
            <DetailRow
              icon={<Mail className="text-blue-500 mr-3" size={20} />}
              label="Email"
              value={profile.email}
            />
            {/* <DetailRow
              icon={<GlobeIcon className="text-blue-500 mr-3" size={20} />}
              label="Country"
              value={profile.country}
            /> */}
          </div>
        </div>

        {/* Account Details Section */}
        <div className="bg-gray-50 p-5 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b border-gray-200 pb-2">
            Company Information
          </h3>
          <div className="space-y-4">
            <DetailRow
              icon={<FaBuilding className="text-blue-500 mr-3" size={20} />}
              label="Company Name"
              value={instituteState?.name}
            />
          </div>
        </div>

        {/* Account Details Section */}
        <div className="bg-gray-50 p-5 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b border-gray-200 pb-2">
            Account Information
          </h3>
          <div className="space-y-4">
            {/* <DetailRow
              icon={<ShieldIcon className="text-blue-500 mr-3" size={20} />}
              label="Role"
              value={profile.role}
            /> */}
            <DetailRow
              icon={<Calendar className="text-blue-500 mr-3" size={20} />}
              label="Account Created"
              value={profile.created_at}
            />
            <DetailRow
              icon={<Calendar className="text-blue-500 mr-3" size={20} />}
              label="Last Sign In"
              value={profile.last_sign_in}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable component for displaying detail rows
const DetailRow = ({ icon, label, value }) => (
  <div className="flex items-center">
    {icon}
    <div>
      <p className="text-sm text-gray-600 font-medium">{label}</p>
      <p className="text-gray-800 font-semibold">{value}</p>
    </div>
  </div>
);

DetailRow.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};
