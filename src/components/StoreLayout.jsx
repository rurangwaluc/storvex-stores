import { Outlet } from "react-router-dom";
import StoreSidebar from "./StoreSidebar";

export default function StoreLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <StoreSidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
