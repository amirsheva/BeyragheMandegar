
export async function getShows(){
 const res = await fetch("/api/admin/shows");
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

export async function deleteShow(id){
 return fetch(`/api/admin/shows/${id}`,{
  method:"DELETE"
 });
}
