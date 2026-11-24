import React,{useEffect,useState} from 'react';
import {workspace,dayOffset,test,nav} from './platform';
import B from './brand.json';
const seat=B.key==='way';
export function Booking({item,mutate,busy}){
 const [day,setDay]=useState(dayOffset()),[option,setOption]=useState(''),[occupied,setOccupied]=useState(null),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>{let active=true;setOccupied(null);setOption('');setError('');
   workspace('availability',{item:item.id}).then(r=>{if(active)setOccupied(r)}).catch(e=>{if(active)setError(e.message)});
   return ()=>{active=false}
 },[item.id,day,revision]);
 const options=seat?Array.from({length:16},(_,i)=>String(i+1).padStart(2,'0')):['09:00','10:30','13:00','15:30'];
 async function submit(){const result=await mutate('reserve',{item:item.id,day,option},'Reservation confirmed',()=>nav('activity'));if(!result)setRevision(n=>n+1)}
 return <div className="panel"><h2>{seat?'Reserve a seat':'Reserve a time'}</h2><label>Date<input {...test('day')} type="date" min={dayOffset(0)} max={dayOffset(30)} value={day} onChange={e=>setDay(e.target.value)}/></label><p className="lean">Portland local time{seat?' · Departure '+item.detail:''}</p>
 {error?<button className="secondary" onClick={()=>setRevision(n=>n+1)}>Retry availability</button>:!occupied?<p>Checking availability…</p>:<div className="slots">{options.map(o=><button className="slot" key={o} {...test('option-'+o)} disabled={occupied.includes(day+' '+o)} aria-pressed={o===option} onClick={()=>setOption(o)}>{o}</button>)}</div>}
 <button className="primary wide" style={{marginTop:15}} {...test('reserve')} disabled={busy||!option||!day} onClick={submit}>{seat?'Issue ticket':'Confirm reservation'}</button></div>
}
export function ReservationList({data,mutate,additional:Additional,afterCancel}){
 const rows=data.records.filter(r=>['seat','viewing','appointment'].includes(r.kind));
 return rows.length?rows.map(r=><article className="record" key={r.id}><div className="row"><span className="tag">{r.status}</span><small>{r.id.slice(0,8).toUpperCase()}</small></div><h2>{r.payload.title}</h2><p>{r.payload.day} · {seat?'Seat ':''}{r.payload.option}</p>{r.status==='Confirmed'&&<>{Additional&&<Additional record={r} item={data.catalog.find(i=>i.id===r.item)}/>}<button className="secondary" {...test('cancel')} onClick={()=>mutate('cancel',{id:r.id},'Reservation cancelled',()=>afterCancel?.(r))}>Cancel reservation</button></>}</article>):<p className="empty">Your reservations will appear here.</p>
}

