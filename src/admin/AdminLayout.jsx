import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({children}) {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
