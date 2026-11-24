import React from 'react';
import {Booking,ReservationList} from './Booking';
import {MapPanel} from './map';
import {nav,test} from './platform';
export function Actions(props){const {data,item,mutate}=props;const saved=data.records.some(r=>r.kind==='favorite'&&r.item===item.id);
 return <><div className="row"><button className="secondary" {...test('favorite')} aria-pressed={saved} onClick={()=>mutate('favorite',{item:item.id},saved?'Removed from shortlist':'Saved to shortlist')}>{saved?'♥ Saved':'♡ Save home'}</button></div><MapPanel items={[item]}/><Booking {...props}/></>}
export function Extras(){return null}
export function Records(props){const homes=props.data.records.filter(r=>r.kind==='favorite');return <><h2>Saved homes</h2>{homes.length?homes.map(r=>{const p=props.data.catalog.find(i=>i.id===r.item);return <button key={r.id} className="card" onClick={()=>nav('item/'+p.id)}><img className="thumb" src={'/media/'+p.id+'.jpg'} alt=""/><h3>{p.title}</h3></button>}):<p className="empty">Save a home to build your shortlist.</p>}<h2>Viewing reservations</h2><ReservationList {...props}/></>}

