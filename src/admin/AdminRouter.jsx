
import Dashboard from "./Dashboard";
import ShowManager from "./ShowManager";
import PerformanceManager from "./PerformanceManager";
import ReservationManager from "./ReservationManager";
import CheckerManager from "./CheckerManager";
import CheckinDashboard from "./CheckinDashboard";

export default function AdminRouter({page="dashboard"}){
 if(page==="shows") return <ShowManager />;
 if(page==="performances") return <PerformanceManager />;
 if(page==="reservations") return <ReservationManager />;
 if(page==="checkers") return <CheckerManager />;
 if(page==="checkin") return <CheckinDashboard />;
 return <Dashboard />;
}
