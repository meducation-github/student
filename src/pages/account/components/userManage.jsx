import { useContext, useEffect, useState } from "react";
import { supabase } from "../../../config/env";
import PropTypes from "prop-types";
import { UserContext } from "../../../context/contexts";

export default function UserManage({ setMessage, setUpdating, updating }) {
  const { userState } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    email: "",
  });
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    country: "",
    role: "Admin",
    created_at: "",
  });
  const [loading, setLoading] = useState(true);

  // Fetch all users (admin only)
  useEffect(() => {
    setProfile({
      name: userState.name,
      email: userState.email,
      country: userState.country,
      role: userState.role,
      created_at: userState.created_at,
    });

    const fetchUsers = async () => {
      if (!userState || profile.role !== "admin") return;

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("users")
          .select("id, name, email, role, created_at");

        if (error) throw error;

        setUsers(data || []);
      } catch (error) {
        setMessage({
          text: `Error loading users: ${error.message}`,
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (profile.role === "Admin") {
      fetchUsers();
    }
  }, [userState, profile.role, supabase]);

  const inviteUser = async (e) => {
    e.preventDefault();

    try {
      setUpdating(true);

      // This is a placeholder - you would need to implement an invite endpoint
      // or use Supabase admin functions depending on your setup
      const { error } = await supabase.functions.invoke("invite-user", {
        body: { email: newUser.email },
      });

      if (error) throw error;

      setNewUser({ email: "" });
      setMessage({
        text: `Invitation sent to ${newUser.email}`,
        type: "success",
      });

      // Refresh user list
      const { data: updatedUsers, error: fetchError } = await supabase
        .from("users")
        .select("id, name, email, role, created_at, email_confirmed_at");

      if (fetchError) throw fetchError;

      setUsers(updatedUsers || []);
    } catch (error) {
      setMessage({
        text: `Error inviting user: ${error.message}`,
        type: "error",
      });
    } finally {
      setUpdating(false);
    }
  };

  const removeUser = async (userId) => {
    if (!confirm("Are you sure you want to remove this user?")) return;

    try {
      setUpdating(true);

      // Delete the user from the auth system and database
      // This is a placeholder - you would need to implement a proper delete flow
      const { error } = await supabase.functions.invoke("delete-user", {
        body: { userId },
      });

      if (error) throw error;

      // Update the local users list
      setUsers(users.filter((user) => user.id !== userId));
      setMessage({ text: "User removed successfully", type: "success" });
    } catch (error) {
      setMessage({
        text: `Error removing user: ${error.message}`,
        type: "error",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleNewUserChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  if (loading && !profile.email) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6">User Management</h2>

        {/* Add User Form */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Invite New User</h3>
          <form onSubmit={inviteUser} className="flex items-end gap-4">
            <div className="flex-1">
              <label
                htmlFor="newUserEmail"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="newUserEmail"
                name="email"
                type="email"
                value={newUser.email}
                onChange={handleNewUserChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="email@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={updating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {updating ? "Sending..." : "Send Invitation"}
            </button>
          </form>
        </div>

        {/* Users List */}
        <div>
          <h3 className="text-lg font-medium mb-4">Users</h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    User
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Role
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Joined
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className={user.id === userState.id ? "bg-blue-50" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-500">
                              {user.name?.charAt(0)?.toUpperCase() ||
                                user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || "No name"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.email_confirmed_at
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {user.email_confirmed_at ? "Verified" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.role || "user"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {user.id !== userState.id && (
                          <button
                            onClick={() => removeUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

UserManage.propTypes = {
  setMessage: PropTypes.node.isRequired,
  setUpdating: PropTypes.node.isRequired,
  updating: PropTypes.node.isRequired,
};
