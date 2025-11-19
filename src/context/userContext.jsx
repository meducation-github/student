import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { UserContext } from "./contexts";

export const UserProvider = ({ children }) => {
  // Initialize from localStorage if available
  const [authUser, setAuthUser] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const savedAuthUser = localStorage.getItem("auth_user");
      const savedStudentData = localStorage.getItem("student_data");

      if (savedAuthUser) {
        setAuthUser(JSON.parse(savedAuthUser));
      }
      if (savedStudentData) {
        setStudentData(JSON.parse(savedStudentData));
      }
    } catch (error) {
      console.error("Error restoring user state:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((user) => {
    setAuthUser(user);
    localStorage.setItem("auth_user", JSON.stringify(user));
    localStorage.setItem("user_id", user.id);
  }, []);

  const setStudent = useCallback((student) => {
    setStudentData(student);
    localStorage.setItem("student_data", JSON.stringify(student));
    if (student?.id) {
      localStorage.setItem("student_id", student.id);
    }
  }, []);

  const logout = useCallback(() => {
    setAuthUser(null);
    setStudentData(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("student_data");
    localStorage.removeItem("user_id");
    localStorage.removeItem("student_id");
  }, []);

  return (
    <UserContext.Provider
      value={{
        authUser,
        studentData,
        loading,
        login,
        setStudent,
        logout,
        // Deprecated - keeping for backward compatibility
        userState: studentData,
        authState: authUser,
        setUser: setStudent,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
