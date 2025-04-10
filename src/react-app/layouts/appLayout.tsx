import { Outlet } from "react-router";
import { Toaster } from "@/react-app/components/ui/sonner";

export default function AppLayout() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}
