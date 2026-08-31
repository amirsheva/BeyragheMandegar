
import {useEffect,useState} from "react";
import {getPerformances} from "../api/performanceApi";

export default function usePerformances(){
 const [items,setItems]=useState([]);

 useEffect(()=>{
  getPerformances().then(setItems);
 },[]);

 return items;
}
