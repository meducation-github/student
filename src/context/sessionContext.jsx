import { useState } from "react";
import PropTypes from "prop-types";
import { SessionContext } from "./contexts";

export const SessionProvider = ({ children }) => {
  const [sessionState, setSessionState] = useState([]);

  const setSession = (param) => {
    setSessionState(param);
  };

  return (
    <SessionContext.Provider
      value={{
        sessionState,
        setSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

SessionProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
