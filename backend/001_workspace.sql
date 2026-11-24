create schema if not exists threshold;
revoke all on schema threshold from public, anon, authenticated;
grant usage on schema threshold to authenticated;
create table threshold.catalog (
  id integer primary key, title text not null, category text not null, description text not null,
  price numeric(12,2) not null, detail text not null, lat numeric, lng numeric
);
create table threshold.accounts (uid uuid primary key references auth.users on delete cascade, role text not null check(role in ('demo','admin')));
create table threshold.profiles (uid uuid references auth.users on delete cascade, space uuid, display_name text not null, primary key(uid,space));
create table threshold.records (
  id uuid primary key default gen_random_uuid(), owner uuid not null references auth.users on delete cascade,
  space uuid not null, pool uuid not null, item integer references threshold.catalog, kind text not null,
  status text not null, slot text, payload jsonb not null default '{}', created_at timestamptz not null default now()
);
create unique index on threshold.records(pool,item,slot) where kind in ('seat','appointment','viewing','assignment') and status <> 'Cancelled';
create unique index on threshold.records(owner,space,item,kind) where kind in ('favorite','course');
alter table threshold.catalog enable row level security;
alter table threshold.accounts enable row level security;
alter table threshold.profiles enable row level security;
alter table threshold.records enable row level security;
revoke all on all tables in schema threshold from public,anon,authenticated;

insert into threshold.catalog values ('1','The Pearl loft','Loft','Open-plan brick loft with west-facing windows.','425000','2 beds','45.5308','-122.682'),
('2','Laurelhurst bungalow','House','Garden bungalow with a covered front porch.','610000','3 beds','45.524','-122.62'),
('3','Eastbank studio','Apartment','Efficient riverside studio near the trails.','235000','1 bed','45.517','-122.661'),
('4','Maple courtyard','House','A sunny courtyard home close to the park.','540000','2 beds','45.506','-122.653');

create or replace function threshold.handle(action text, args jsonb, installation uuid)
returns jsonb language plpgsql security definer set search_path='' as $body$
<<handle>>
declare
  uid uuid := auth.uid();
  mode text;
  scope uuid;
  pool_id uuid := '00000000-0000-0000-0000-000000000000';
  product threshold.catalog%rowtype;
  rec threshold.records%rowtype;
  target integer;
  slot_key text;
  day date;
  amount numeric := 0;
  qty int;
  line jsonb;
  lines jsonb := '[]';
  info jsonb := '{}';
  label text;
begin
  if uid is null or installation is null then raise exception 'Sign in to continue'; end if;
  select a.role into mode from threshold.accounts a where a.uid=handle.uid;
  if mode is null and (auth.jwt()->>'email') like '%@demo.mobile.invalid' then raise exception 'Use this app’s demo account'; end if;
  scope := case when mode='demo' then installation else uid end;
  if mode='demo' then if installation=pool_id then raise exception 'Invalid demo installation'; end if; pool_id := installation; end if;
  if action='profile' then
    label := trim(args->>'name');
    if coalesce(length(label),0) not between 1 and 60 then raise exception 'Enter a name of 1–60 characters'; end if;
    insert into threshold.profiles values(uid,scope,label) on conflict on constraint profiles_pkey do update set display_name=excluded.display_name;
  elsif action='cancel' then
    update threshold.records r set status='Cancelled' where r.id=(args->>'id')::uuid and r.owner=uid and r.space=scope and r.kind in ('seat','viewing','appointment') and r.status='Confirmed';
    if not found then raise exception 'Reservation no longer available'; end if;
  elsif action not in ('state','availability') then
    
if action='reserve' then
  select * into strict product from threshold.catalog where id=(args->>'item')::int;
  day := (args->>'day')::date;
  if day is null or day < current_date or day > current_date+30 then raise exception 'Choose a date in the next 30 days'; end if;
  label := args->>'option';
  if label is null or label not in ('09:00','10:30','13:00','15:30') then raise exception 'Choose a listed time'; end if;
    if (day+label::time) at time zone 'America/Los_Angeles' <= now() then raise exception 'This time has passed'; end if;
  slot_key := day::text || ' ' || label;
  insert into threshold.records(owner,space,pool,item,kind,status,slot,payload) values(uid,scope,pool_id,product.id,'viewing','Confirmed',slot_key,jsonb_build_object('day',day,'option',label,'title',product.title));

elsif action='favorite' then
  target := (args->>'item')::int;
  perform pg_advisory_xact_lock(hashtextextended(scope::text || target,0));
  delete from threshold.records r where r.owner=uid and r.space=scope and r.item=target and r.kind='favorite';
  if not found then insert into threshold.records(owner,space,pool,item,kind,status) values(uid,scope,pool_id,target,'favorite','Saved'); end if;

else raise exception 'Unknown reservation action'; end if;

  end if;
  if action='availability' then
    select coalesce(jsonb_agg(r.slot),'[]') into info from threshold.records r where r.pool=pool_id and r.item=(args->>'item')::integer and r.status <> 'Cancelled' and r.kind in ('seat','viewing','appointment','assignment');
    return info;
  end if;
  return jsonb_build_object(
    'catalog',(select coalesce(jsonb_agg(to_jsonb(c) order by c.id),'[]') from threshold.catalog c),
    'records',(select coalesce(jsonb_agg(to_jsonb(r)-'owner'-'space'-'pool' order by r.created_at desc),'[]') from threshold.records r where (r.owner=uid and r.space=scope) or (mode='admin' and r.pool=pool_id)),
    'name',(select p.display_name from threshold.profiles p where p.uid=handle.uid and p.space=scope),
    'demo',coalesce(mode='demo',false),'admin',coalesce(mode in ('demo','admin'),false)
  );
exception when unique_violation then raise exception 'Just reserved. Choose another option.';
end $body$;
revoke all on function threshold.handle(text,jsonb,uuid) from public,anon;
grant execute on function threshold.handle(text,jsonb,uuid) to authenticated;
create or replace function public.threshold_workspace(action text,args jsonb,installation uuid)
returns jsonb language sql security invoker set search_path='' as $$
  select threshold.handle(action,args,installation);
$$;
revoke all on function public.threshold_workspace(text,jsonb,uuid) from public,anon;
grant execute on function public.threshold_workspace(text,jsonb,uuid) to authenticated;
notify pgrst,'reload schema';

