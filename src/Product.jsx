import React,{useState} from 'react';
import B from './brand.json';
import {nav,usd,euro,test} from './platform';
import {Actions,Records,Extras} from './Domain';
import {MapPanel} from './map';
function itemPrice(i){return B.key==='grove'?euro(i.price)+' · '+i.detail:B.key==='threshold'?usd(i.price)+' · '+i.detail:i.detail}
export function Catalog(props){
 const [query,setQuery]=useState(''),[category,setCategory]=useState('All'),[view,setView]=useState(false),[budget,setBudget]=useState(''),[beds,setBeds]=useState('0');
 const rows=props.data.catalog;
 const filtered=rows.filter(r=>(category==='All'||category===r.category)&&[r.title,r.category,r.detail].join(' ').toLowerCase().includes(query.toLowerCase())&&(!budget||r.price<=Number(budget))&&(!Number(beds)||parseInt(r.detail)>=Number(beds)));
 return <section><span className="kicker">{B.tag}</span><h1>{B.title}</h1><div className="hero"><img src="/poster.jpg" alt={B.imageDescription}/></div>
 <label><span>Search {B.tab.toLowerCase()}</span><input type="search" placeholder={'Search '+B.tab.toLowerCase()} value={query} onChange={e=>setQuery(e.target.value)} /></label>
 <div className="chips">{['All',...new Set(rows.map(r=>r.category))].map(c=><button className="chip" aria-pressed={category===c} key={c} onClick={()=>setCategory(c)}>{c}</button>)}</div>
 {B.key==='threshold'&&<details><summary>Price, bedrooms and map</summary><div className="grid2"><label>Maximum price<input type="number" min="0" placeholder="Any price" value={budget} onChange={e=>setBudget(e.target.value)}/></label><label>Bedrooms<select value={beds} onChange={e=>setBeds(e.target.value)}>{[0,1,2,3].map(n=><option key={n} value={n}>{n?n+'+ bedrooms':'Any number'}</option>)}</select></label></div><button className="secondary" onClick={()=>setView(!view)}>{view?'Hide map':'Show map'}</button></details>}
 {view&&filtered.length>0&&<MapPanel items={filtered} choose={id=>nav('item/'+id)}/>}
 <div className="row"><h2>{B.section}</h2><span className="small">{filtered.length} {filtered.length===1?'result':'results'}</span></div>
 <div className="cards">{filtered.map(i=><button className="card" key={i.id} {...test('card-'+i.id)} onClick={()=>nav('item/'+i.id)}>{B.key==='way'?<strong className="tickettime">{i.detail}</strong>:<img className="thumb" src={'/media/'+i.id+'.jpg'} alt=""/>}<div className="cardText"><span className="small">{i.category}</span><h3>{i.title}</h3><small>{itemPrice(i)}</small></div></button>)}</div>
 {!filtered.length&&<p className="empty">No matches. Try another search or category.</p>}<Extras {...props}/></section>
}
export function Detail({item,...props}){
 return <section><button className="back" onClick={()=>nav('browse')}>← {B.tab}</button><div><span className="kicker">{item.category}</span></div><h1>{item.title}</h1><p>{item.description}</p>
 {!['way','parcel'].includes(B.key)&&<img className="detail-photo" src={'/media/'+item.id+'.jpg'} alt=""/>}<span className="tag">{itemPrice(item)}</span><Actions item={item} {...props}/></section>
}
export function Activity(props){return <section><span className="kicker">{B.name}</span><h1>{B.activity}</h1><Records {...props}/></section>}

