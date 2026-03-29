import "./index.css";

import App from "./App";
import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./theme/ThemeProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "14px",
            border: "1px solid rgba(148,163,184,0.18)",
            background: "rgb(24,27,31)",
            color: "#fff",
          },
        }}
      />
    </ThemeProvider>
  </React.StrictMode>
);