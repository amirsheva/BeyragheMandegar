import React from "react";
import ReactDOM from "react-dom/client";
import AdminApp from "../src/admin/AdminApp.jsx";
import { installApiBase } from "../src/lib/apiBase.js";
import "../src/index.css";

installApiBase();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
);
