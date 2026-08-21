
import Dashboard from "./Dashboard";
import ShowManager from "./ShowManager";
import PerformanceManager from "./PerformanceManager";
import ReservationManager from "./ReservationManager";

export default function AdminRouter({page="dashboard"}){
 if(page==="shows") return <ShowManager />;
 if(page==="performances") return <PerformanceManager />;
 if(page==="reservations") return <ReservationManager />;
 return <Dashboard />;
}
