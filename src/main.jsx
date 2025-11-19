import { BrowserRouter, Route, Routes } from "react-router-dom";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ContextProvider } from "./context/index.jsx";
import App from "./App.jsx";
import Home from "./pages/home.jsx";
import React from "react";
import { Signup } from "./pages/account/create/signup.jsx";
import { Login } from "./pages/account/login/index.jsx";
import Onboarding from "./pages/account/onboarding.jsx";
import Finance from "./pages/finance/index.jsx";
import Attendance from "./pages/attendance/index.jsx";
import Admission from "./pages/admission/index.jsx";
import Profile from "./pages/profile/index.jsx";
import Fees from "./pages/finance/fees.jsx";
import Curriculum from "./pages/curriculum/index.jsx";
import Notifications from "./pages/notifications/index.jsx";
import Chat from "./pages/chat/index.jsx";

createRoot(document.getElementById("root")).render(
  <ContextProvider>
    <BrowserRouter>
      <Routes>
        {/* <Route path="logout" element={<Logout />} /> */}
        <Route path="/" element={<App />}>
          {/* <Route path="" element={<Home />} /> */}
          <Route path="" element={<Profile />} />
          <Route path="finance" element={<Finance />}>
            <Route path="fees" element={<Fees />} />
          </Route>
          <Route path="attendance" element={<Attendance />} />
          <Route path="admission" element={<Admission />} />
          <Route path="studies" element={<Curriculum />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="chat" element={<Chat />} />
          <Route path="*" element={<h1>404</h1>} />
        </Route>

        <Route path="/onboarding" element={<Onboarding />} />

        <Route
          path="login"
          element={
            <React.Suspense fallback={<></>}>
              <Login />
            </React.Suspense>
          }
        />

        <Route
          path="/signup"
          element={
            <React.Suspense fallback={<></>}>
              <Signup />
            </React.Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  </ContextProvider>
);
