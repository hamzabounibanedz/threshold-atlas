import { createClient } from '@supabase/supabase-js';
import brand from './brand.json';

export const auth = createClient('https://chwwunmxjinxkfkxymrw.supabase.co','sb_publishable_gk_51sNbzg-JHufTd96WVg_XRetnV8o');
const installation = localStorage.getItem('installation') || crypto.randomUUID();
localStorage.setItem('installation', installation);

export async function workspace(action = 'state', args = {}) {
  const { data, error } = await auth.rpc(brand.key + '_workspace', { action, args, installation });
  if (error) throw new Error(error.message);
  return data;
}

export const id = () => crypto.randomUUID();
export const usd = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
export const euro = n => new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR'}).format(n);
export function dayOffset(days=1) {
  const date = new Date();
  date.setDate(date.getDate()+days);
  return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
}
export function nav(path) { location.hash=path; }
export const test = value => ({'data-test':value});

