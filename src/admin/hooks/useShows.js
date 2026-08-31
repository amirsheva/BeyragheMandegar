
import {useEffect,useState} from "react";
import {getShows} from "../api/showApi";

export default function useShows(){
 const [shows,setShows]=useState([]);

 useEffect(()=>{
  getShows().then(setShows);
 },[]);

 return shows;
}
