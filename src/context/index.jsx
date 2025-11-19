import { Context } from "./contexts";
import { InstituteProvider } from "./instituteContext";
import { SessionProvider } from "./sessionContext";
import { UserProvider } from "./userContext";
import { NotificationProvider } from "./notificationContext";
import { ChatPreferencesProvider } from "./chatPreferencesContext";
import PropTypes from "prop-types";

export const ContextProvider = ({ children }) => {
  return (
    <Context.Provider>
      <UserProvider>
        <NotificationProvider>
          <ChatPreferencesProvider>
            <InstituteProvider>
              <SessionProvider>{children}</SessionProvider>
            </InstituteProvider>
          </ChatPreferencesProvider>
        </NotificationProvider>
      </UserProvider>
    </Context.Provider>
  );
};

ContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
