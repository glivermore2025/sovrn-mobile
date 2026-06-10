-- Device claim support for shared-device account switches.
--
-- Historical device_events keep their original user_id. This function only
-- controls which account receives future events from a device_install_id.

create or replace function public.claim_user_device(
  p_device_install_id text,
  p_device_platform text default null,
  p_device_model text default null,
  p_device_name text default null,
  p_os_name text default null,
  p_os_version text default null,
  p_app_version text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_device_id uuid;
begin
  if v_user_id is null then
    raise exception 'claim_user_device requires an authenticated user';
  end if;

  update public.user_devices
     set user_id = v_user_id,
         device_platform = coalesce(p_device_platform, device_platform),
         device_model = coalesce(p_device_model, device_model),
         device_name = coalesce(p_device_name, device_name),
         platform = coalesce(p_device_platform, platform),
         model = coalesce(p_device_model, model),
         os_name = coalesce(p_os_name, os_name),
         os_version = coalesce(p_os_version, os_version),
         app_version = coalesce(p_app_version, app_version),
         last_seen_at = now()
   where device_install_id = p_device_install_id
   returning id into v_device_id;

  if v_device_id is null then
    insert into public.user_devices (
      user_id,
      device_install_id,
      device_platform,
      device_model,
      device_name,
      platform,
      model,
      os_name,
      os_version,
      app_version,
      last_seen_at
    )
    values (
      v_user_id,
      p_device_install_id,
      p_device_platform,
      p_device_model,
      p_device_name,
      p_device_platform,
      p_device_model,
      p_os_name,
      p_os_version,
      coalesce(p_app_version, '1.0.0'),
      now()
    )
    returning id into v_device_id;
  end if;

  return v_device_id;
end;
$$;

revoke all on function public.claim_user_device(
  text,
  text,
  text,
  text,
  text,
  text,
  text
) from public;

grant execute on function public.claim_user_device(
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to authenticated;
