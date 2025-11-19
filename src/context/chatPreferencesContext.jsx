import { createContext, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";

const ChatPreferencesContext = createContext(null);

export const ChatPreferencesProvider = ({ children }) => {
  const [floatingEnabled, setFloatingEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem("chat_floating_enabled");
    return stored !== "false";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "chat_floating_enabled",
      floatingEnabled ? "true" : "false"
    );
  }, [floatingEnabled]);

  return (
    <ChatPreferencesContext.Provider
      value={{ floatingEnabled, setFloatingEnabled }}
    >
      {children}
    </ChatPreferencesContext.Provider>
  );
};

ChatPreferencesProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useChatPreferences = () => {
  const context = useContext(ChatPreferencesContext);
  if (!context) {
    throw new Error(
      "useChatPreferences must be used within a ChatPreferencesProvider"
    );
  }
  return context;
};
