import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import "./index.css";
import Root from "./routes/root";
import SettingsPage from "./routes/settings.jsx";
import History from "./routes/history.jsx";
import SearchPage from "./routes/index.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root/>,
    children: [
      {
        path: "/",
        element: <SearchPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "history",
        element: <History />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);