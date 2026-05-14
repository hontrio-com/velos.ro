import { AdminSidebar } from "./admin-sidebar";

interface AdminShellProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
}

export function AdminShell({ children, userName, userEmail }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <AdminSidebar userName={userName} userEmail={userEmail} />
      <div className="lg:ml-[220px] min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
}
