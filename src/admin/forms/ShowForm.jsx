import {useState} from 'react';

export default function ShowForm({onSubmit}) {
 const [form,setForm]=useState({
  title:'',
  director:'',
  actors:'',
  description:''
 });

 return <div>Show Form Ready</div>;
}
