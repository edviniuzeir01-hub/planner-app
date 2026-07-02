import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { registerServiceWorker } from "./push";
import { adoptCodeFromUrl } from "./space";
import { applyTheme, getTheme } from "./theme";
import "./styles.css";

adoptCodeFromUrl();
applyTheme(getTheme());
registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
