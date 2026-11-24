import React,{useEffect,useRef} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
export const depot={id:0,title:'Union Station dispatch',lat:45.5286,lng:-122.6765};
export function MapPanel({items,choose,line=false}){
 const root=useRef(), callback=useRef(choose);callback.current=choose;
 const signature=JSON.stringify(items.map(i=>[i.id,i.title,i.lat,i.lng]));
 useEffect(()=>{
   const positions=JSON.parse(signature);
   if(!positions.length)return;
   const map=L.map(root.current,{scrollWheelZoom:false});
   L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
   const bounds=[];
   positions.forEach(([id,title,lat,lng])=>{
     const coordinate=[Number(lat),Number(lng)];bounds.push(coordinate);
     const content=document.createElement(callback.current?'button':'span');content.textContent=title;
     if(callback.current){content.addEventListener('click',()=>callback.current(id))}
     L.circleMarker(coordinate,{radius:8,color:'#fff',weight:3,fillColor:'#214c68',fillOpacity:1}).addTo(map).bindPopup(content);
   });
   if(line)L.polyline(bounds,{color:'#376d81',dashArray:'5 6'}).addTo(map);
   map.fitBounds(L.latLngBounds(bounds).pad(.2),{maxZoom:15,padding:[15,15]});
   const observer=new ResizeObserver(()=>map.invalidateSize());observer.observe(root.current);
   return ()=>{observer.disconnect();map.remove()};
 },[signature,line]);
 return <div className="map" ref={root} aria-label="Street map"/>;
}

