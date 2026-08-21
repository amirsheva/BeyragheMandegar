import Header from "./Header";
import Footer from "./Footer";

export default function AppShell({children}) {
  return (
    <div dir="rtl" className="min-h-screen bg-[#111] text-white">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
