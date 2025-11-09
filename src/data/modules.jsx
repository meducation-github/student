import { FaBalanceScale, FaHome, FaLeaf, FaSearch } from "react-icons/fa";
import { MdPowerSettingsNew, MdVerified } from "react-icons/md";

export const MODULES = [
  { name: "Home", link: "./", icon: <FaHome className="text-lg" /> },
  { name: "Data", link: "./data", icon: <FaSearch className="text-lg" /> },
  {
    name: "Interface",
    link: "./Leverage",
    icon: <FaBalanceScale className="text-lg" />,
  },
  {
    name: "Training",
    link: "./Evolve",
    icon: <FaLeaf className="text-lg" />,
  },
  {
    name: "Testing",
    link: "./Validate",
    icon: <MdVerified className="text-lg" />,
  },
  {
    name: "Deploy",
    link: "./Activate",
    icon: <MdPowerSettingsNew className="text-lg" />,
  },
];
