
export async function getDashboardStats(){
 const res=await fetch("/api/admin/dashboard/stats");
 return res.json();
}
