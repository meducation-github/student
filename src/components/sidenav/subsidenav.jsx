import { NavLink } from "react-router-dom";

export default function SubSidenav({
  isMinimized,
  tabs,
  activeTab,
  setActiveTab,
}) {
  return (
    <div
      className={`${
        isMinimized ? "basis-16" : "basis-1/5"
      } transition-all duration-300`}
    >
      <div className="lg:flex flex-col  mt-4 mb-2  text-left">
        {Object.values(tabs).map((tab, index) => (
          <NavLink
            key={index}
            to={tab.path}
            className={`px-4 mt-1 py-3 rounded-sm text-gray-600 text-left cursor-pointer hover:bg-gray-200 flex items-center gap-3 ${
              activeTab === tab.key ? "bg-gray-100 !text-blue-600" : ""
            }`}
            onClick={() => setActiveTab(tab.key)}
            title={isMinimized ? tab.title : ""}
          >
            {tab.icon}
            {!isMinimized && <span>{tab.title}</span>}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
