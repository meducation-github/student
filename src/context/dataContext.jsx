import { useState } from "react";
import PropTypes from "prop-types";
import { DataContext } from "./contexts";

export const DataProvider = ({ children }) => {
  const [dataState, setDataState] = useState([]);

  const setData = (user) => {
    setDataState(user);
  };

  return (
    <DataContext.Provider
      value={{
        dataState,
        setData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

DataProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
