import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import ChatBot from "./components/ChatBot.jsx";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const AppTree = () => (
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <App />
        <ChatBot />
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <AppTree />
      </GoogleOAuthProvider>
    ) : (
      <AppTree />
    )}
  </StrictMode>
);
