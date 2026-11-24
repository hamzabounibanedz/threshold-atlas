do $seed$
declare account_id uuid:=gen_random_uuid(); login text:='threshold@demo.mobile.invalid';
begin
  insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
  values('00000000-0000-0000-0000-000000000000',account_id,'authenticated','authenticated',login,extensions.crypt('StudioVisit!27',extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','','');
  insert into auth.identities(provider_id,user_id,identity_data,provider,created_at,updated_at)
  values(account_id::text,account_id,jsonb_build_object('sub',account_id::text,'email',login,'email_verified',true),'email',now(),now());
  insert into threshold.accounts values(account_id,'demo');
end $seed$;
create function threshold.protect_demo() returns trigger language plpgsql set search_path='' as $$
begin
  if old.email='threshold@demo.mobile.invalid' and (new.email is distinct from old.email or new.encrypted_password is distinct from old.encrypted_password or coalesce(new.email_change,'')<>'' or new.phone is distinct from old.phone) then raise exception 'Demo identity is read-only'; end if;
  return new;
end $$;
revoke all on function threshold.protect_demo() from public,anon,authenticated;
create trigger threshold_demo_identity before update on auth.users for each row execute function threshold.protect_demo();
