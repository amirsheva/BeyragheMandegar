
export async function getShows(){
 const res = await fetch("/api/admin/shows");
 return res.json();
}

export async function getPerformances(){
 const res = await fetch("/api/admin/performances");
 return res.json();
}

export async function createShow(data){
 const res = await fetch("/api/admin/shows",{
  method:"POST",
  headers:{
   "Content-Type":"application/json"
  },
  body:JSON.stringify(data)
 });

 return res.json();
}
