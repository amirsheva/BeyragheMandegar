
import AdminLayout from "./AdminLayout";
import Dashboard from "./Dashboard";
import ShowManager from "./ShowManager";
import PerformanceManager from "./PerformanceManager";

export default function AdminApp(){
 const path = window.location.pathname;

 let page = <Dashboard />;

 if(path.includes("/admin/shows")){
  page = <ShowManager />;
 }

 if(path.includes("/admin/performances")){
  page = <PerformanceManager />;
 }

 return (
  <AdminLayout>
    {page}
  </AdminLayout>
 );
}
