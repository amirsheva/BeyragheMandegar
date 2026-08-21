
import {useEffect,useState} from "react";
import {getDashboardStats} from "../api/dashboardApi";

export default function useDashboardStats(){
 const [stats,setStats]=useState(null);

 useEffect(()=>{
  getDashboardStats()
   .then(setStats);
 },[]);

 return stats;
}
