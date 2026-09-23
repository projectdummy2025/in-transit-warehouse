import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import "@/index.css";

// Mount react application root
const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
