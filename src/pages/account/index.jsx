import { useState } from "react";
import AccountDetails from "./components/accountDetails";
import PageHeader from "../../components/pageHeader";
import Sessions from "./components/sessions";
import Plans from "./planes";
import SubSidenav from "../../components/sidenav/subsidenav";
import { Calendar, CreditCard, User } from "lucide-react";

export const Account = () => {
  const [activeTab, setActiveTab] = useState("account");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isMinimized, setIsMinimized] = useState(false);

  const AccountTabs = [
    { title: "Profile", key: "account", icon: <User className="w-5 h-5" /> },
    {
      title: "Sessions",
      key: "sessions",
      icon: <Calendar className="w-5 h-5" />,
    },
    { title: "Plans", key: "plans", icon: <CreditCard className="w-5 h-5" /> },
    {
      title: "Billing",
      key: "billing",
      icon: <CreditCard className="w-5 h-5" />,
    },
  ];

  return (
    <div className="text-left overflow-hidden">
      <PageHeader
        title={"Account"}
        subtitle={`Manage your account settings, customize AI, and change your password.`}
        setIsMinimized={setIsMinimized}
        isMinimized={isMinimized}
      />

      <div className="lg:flex">
        <SubSidenav
          isMinimized={isMinimized}
          setIsMinimized={setIsMinimized}
          tabs={AccountTabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <div className="basis-4/5">
          {message.text && (
            <div
              className={`p-4 ${
                message.type === "error"
                  ? "bg-red-100 text-red-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {message.text}
              <button
                className="float-right text-sm"
                onClick={() => setMessage({ text: "", type: "" })}
              >
                ✕
              </button>
            </div>
          )}

          {activeTab === "sessions" && (
            <div>
              <Sessions />
            </div>
          )}

          {activeTab === "account" && (
            <div className="flex justify-center items-center h-full">
              {/* <AccountDetails /> */}
              <h1 className="text-center mt-10 text-2xl font-bold">
                Coming Soon
              </h1>
            </div>
          )}

          {activeTab === "plans" && (
            <div>
              <Plans />
            </div>
          )}

          {activeTab === "billing" && (
            <div className="flex justify-center items-center h-full">
              <h1 className="text-center mt-10 text-2xl font-bold">
                Coming Soon
              </h1>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
