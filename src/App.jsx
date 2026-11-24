import React,{useEffect,useState,useRef} from 'react';
import { IonApp, setupIonicReact } from '@ionic/react';
import { App as Device } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { auth,workspace,nav,test } from './platform';
import Brand from './brand.json';
import { Catalog,Detail,Activity } from './Product';
import './style.css';
setupIonicReact();
const B=Brand;
function goHome(){nav('browse')}
function HomeMark(){return <img className="mark" src="/mark.png" alt=""/>}
function Login({run,busy,setNotice}){
 const [signup,setSignup]=useState(false);
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 async function sign(e,p,register=false){
   const {data,error}=register?await auth.auth.signUp({email:e,password:p}):await auth.auth.signInWithPassword({email:e,password:p});
   if(error)throw error;
   if(register && !data.session)setNotice('Check your email to confirm your account, then sign in.');
   else goHome();
 }
 return <main className="login"><section className="cover"><img src="/poster.jpg" alt=""/><div className="coverbrand"><HomeMark/>{B.name}</div></section>
 <section className="login-body"><span className="kicker">{B.tag}</span><h1>{B.hero}</h1><p>{B.subtitle}</p>
 <button className="primary" disabled={busy} {...test('demo')} onClick={()=>run(()=>sign(B.key+'@demo.mobile.invalid','StudioVisit!27'))}>Explore demo <b>→</b></button>
 <details><summary>{signup?'Create an account':'Sign in with email'}</summary><form onSubmit={e=>{e.preventDefault();run(()=>sign(email.trim(),password,signup))}}>
 <label>Email<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
 <label>Password<input type="password" minLength={signup?8:1} autoComplete={signup?'new-password':'current-password'} required value={password} onChange={e=>setPassword(e.target.value)}/></label>
 <button className="primary" disabled={busy}>{signup?'Create account':'Sign in'}</button></form><button className="link" onClick={()=>setSignup(!signup)}>{signup?'Already registered? Sign in':'Create a personal account'}</button></details></section></main>
}
function Profile({data,mutate,run,theme,changeTheme,session}){
 const [name,setName]=useState(data.name||'');
 return <section><span className="kicker">Your workspace</span><h1>Profile</h1><div className="panel"><h2>{data.name||'Your account'}</h2><p>{session.user.email}</p>
 <form onSubmit={e=>{e.preventDefault();mutate('profile',{name},'Profile saved')}}><label>Display name<input {...test('profile-name')} value={name} maxLength={60} onChange={e=>setName(e.target.value)} required/></label><button className="secondary">Save profile</button></form></div>
 <div className="panel"><label>Appearance<select value={theme} onChange={e=>changeTheme(e.target.value)}><option value="system">Use device setting</option><option value="light">Light</option><option value="dark">Dark</option></select></label></div>
 <p>{data.demo?'Demo records are private to this installation. Use fictional details.':'Your records sync to this account.'}</p><p>{B.context}</p><details><summary>Open-source notices</summary><pre>{B.license}</pre><p>Map data © OpenStreetMap contributors. Photography credits are included with the release.</p></details>
 <button className="secondary" {...test('logout')} onClick={()=>run(async()=>{const {error}=await auth.auth.signOut({scope:'local'});if(error)throw error;goHome()})}>Sign out</button></section>
}
export default function App(){
 const [session,setSession]=useState(undefined),[data,setData]=useState(null),[route,setRoute]=useState(location.hash.slice(1)||'browse');
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[theme,setTheme]=useState('system'),[reload,setReload]=useState(0);
 const busyRef=useRef(false), scroller=useRef(null), identity=useRef(null);
 useEffect(()=>{
   const change=()=>{setRoute(location.hash.slice(1)||'browse');setNotice('');scroller.current?.scrollTo(0,0)};
   window.addEventListener('hashchange',change);
   const {data:{subscription}}=auth.auth.onAuthStateChange((_evt,next)=>{identity.current=next?.user.id;setSession(next)});
   Preferences.get({key:'appearance'}).then(({value})=>setTheme(value||'system'));
   let handler=Capacitor.isNativePlatform()?Device.addListener('backButton',()=>{if(location.hash && location.hash!=='#browse'){history.back()}else{Device.exitApp()}}):null;
   return ()=>{window.removeEventListener('hashchange',change);subscription.unsubscribe();handler?.then(h=>h.remove())};
 },[]);
 useEffect(()=>{document.documentElement.dataset.theme=theme},[theme]);
 const uid=session?.user?.id;
 useEffect(()=>{setData(null);setNotice('');let current=true;if(uid) workspace().then(result=>{if(current)setData(result)}).catch(e=>{if(current)setNotice(e.message)});return ()=>{current=false}},[uid,reload]);
 async function run(fn){if(busyRef.current)return;busyRef.current=true;setBusy(true);setNotice('');try{return await fn()}catch(e){setNotice(e.message||String(e))}finally{busyRef.current=false;setBusy(false)}}
 const mutate=(action,args,msg,done)=>run(async()=>{const actor=identity.current;const next=await workspace(action,args);if(actor!==identity.current)return;setData(next);if(done)await done(next);if(msg)setNotice(msg);return next});
 const props={data,mutate,run,busy,setNotice,route};
 const parts=route.split('/'), page=parts[0];
 const item=data?.catalog.find(c=>c.id===Number(parts[1]));
 const changeTheme=t=>{setTheme(t);Preferences.set({key:'appearance',value:t})};
 return <IonApp><div className={'shell '+B.key} style={{'--accent':B.color,'--pale':B.light,'--ink':B.ink}}><div className="viewport" ref={scroller}>
 {session===undefined?<div className="waiting">Opening {B.name}…</div>:!session?<Login {...{run,busy,setNotice}}/>:<>
 <header><button className="brand" onClick={goHome}><HomeMark/>{B.name}</button><button className="avatar" aria-label="Open profile" onClick={()=>nav('profile')}>{(data?.name||'Me').slice(0,2)}</button></header>
 <main>{!data?<section><h2>{notice?'Connection interrupted':'Opening workspace…'}</h2>{notice&&<button className="secondary" onClick={()=>setReload(n=>n+1)}>Retry connection</button>}</section>:page==='profile'?<Profile {...props} {...{theme,changeTheme,session}}/>:page==='activity'?<Activity {...props}/>:page==='item'&&item?<Detail key={item.id} item={item} {...props}/>:<Catalog {...props}/>}</main></>}
 </div>{session&&data&&<nav>{[[B.tab,'browse','⌂'],[B.activity,'activity','≡'],['Profile','profile','○']].map(([name,url,icon])=><button key={url} {...test('nav-'+url)} aria-current={(page===url||page==='item'&&url==='browse')?'page':undefined} onClick={()=>nav(url)}><span aria-hidden="true">{icon}</span>{name}</button>)}</nav>}
 {busy&&<div className="working" role="status">Working…</div>}{notice&&<div className="notice" role="status">{notice}<button aria-label="Dismiss message" onClick={()=>setNotice('')}>×</button></div>}</div></IonApp>
}

