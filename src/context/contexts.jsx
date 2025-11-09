import { createContext } from "react";

export const Context = createContext();
export const UserContext = createContext([]);
export const InstituteContext = createContext([]);
export const DataContext = createContext([]);
export const DataFilesContext = createContext([]);
export const SessionContext = createContext([]);
export const SidenavContext = createContext({
  isMinimized: false,
  setIsMinimized: () => {},
});
