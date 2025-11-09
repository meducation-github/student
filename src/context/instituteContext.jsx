import { useState } from "react";
import PropTypes from "prop-types";
import { InstituteContext } from "./contexts";

export const InstituteProvider = ({ children }) => {
  const [instituteState, setInstituteState] = useState([]);

  const setInstitute = (param) => {
    setInstituteState(param);
  };

  return (
    <InstituteContext.Provider
      value={{
        instituteState,
        setInstitute,
      }}
    >
      {children}
    </InstituteContext.Provider>
  );
};

InstituteProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
