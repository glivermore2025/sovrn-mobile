# MVP Connectivity + Buyer Workflow

This document captures the backend and buyer-layer SQL / route guidance for the next MVP steps.

## 1. Mobile connectivity ingestion

New mobile helper files:

- `src/lib/permissions.ts`
- `src/lib/ingestConnectivityEvent.ts`

The app now:

- computes the current `device_install_id`
- fetches `user_module_permissions` for that device on launch
- caches permissions in memory
- sends a connectivity event when the app becomes active or network connectivity changes
- only inserts events when `connectivity.can_collect = true`
- stores `consent_version` and `can_sell_snapshot`

Example payload:

```json
{
  "network_type": "wifi",
  "is_connected": true,
  "is_internet_reachable": true,
  "carrier": null,
  "event_type": "snapshot"
}
```

## 2. Backend transformation SQL

Run this in Supabase to build or refresh the daily connectivity dataset:

```sql
create or replace function public.refresh_connectivity_daily(
  p_start_date date,
  p_end_date date
)
returns void
language plpgsql
as $$
begin
  insert into public.dataset_connectivity_daily (
    date,
    device_install_id,
    user_id,
    uptime_pct,
    disconnect_count,
    primary_network,
    carrier,
    platform,
    consent_version,
    sellable,
    created_at
  )
  select
    date(de.captured_at) as date,
    de.device_install_id,
    de.user_id,

    round(
      100.0 * avg(
        case
          when coalesce((de.payload_json->>'is_internet_reachable')::boolean, false) then 1
          else 0
        end
      )::numeric,
      2
    ) as uptime_pct,

    greatest(
      count(*) filter (
        where coalesce((de.payload_json->>'is_connected')::boolean, false) = false
      ) - 1,
      0
    )::integer as disconnect_count,

    mode() within group (
      order by nullif(de.payload_json->>'network_type', '')
    ) as primary_network,

    mode() within group (
      order by nullif(de.payload_json->>'carrier', '')
    ) as carrier,

    max(ud.platform) as platform,

    max(de.consent_version) as consent_version,

    bool_or(de.can_sell_snapshot) as sellable,

    now() as created_at
  from public.device_events de
  join public.user_devices ud
    on ud.device_install_id = de.device_install_id
  where de.module_key = 'connectivity'
    and date(de.captured_at) between p_start_date and p_end_date
  group by
    date(de.captured_at),
    de.device_install_id,
    de.user_id
  on conflict (date, device_install_id)
  do update set
    user_id = excluded.user_id,
    uptime_pct = excluded.uptime_pct,
    disconnect_count = excluded.disconnect_count,
    primary_network = excluded.primary_network,
    carrier = excluded.carrier,
    platform = excluded.platform,
    consent_version = excluded.consent_version,
    sellable = excluded.sellable,
    created_at = excluded.created_at;
end;
$$;
```

Test with:

```sql
select public.refresh_connectivity_daily(current_date - 7, current_date);
```

## 3. Purchase persistence schema

Add frozen filter storage and export path to purchases:

```sql
alter table public.dataset_purchases
add column if not exists filter_json jsonb not null default '{}'::jsonb;

alter table public.dataset_purchases
add column if not exists export_path text;
```

## 4. Buyer preview route sample

A backend query layer should query `dataset_connectivity_daily` and not raw events.

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const body = await req.json();

  let query = supabase
    .from('dataset_connectivity_daily')
    .select(
      'date, platform, carrier, primary_network, disconnect_count, uptime_pct',
      { count: 'exact' },
    )
    .eq('sellable', true)
    .order('date', { ascending: false })
    .limit(body.limit ?? 100);

  if (body.dateFrom) query = query.gte('date', body.dateFrom);
  if (body.dateTo) query = query.lte('date', body.dateTo);
  if (body.platforms?.length) query = query.in('platform', body.platforms);
  if (body.carriers?.length) query = query.in('carrier', body.carriers);
  if (body.networkTypes?.length) query = query.in('primary_network', body.networkTypes);
  if (body.uptimeMin != null) query = query.gte('uptime_pct', body.uptimeMin);
  if (body.uptimeMax != null) query = query.lte('uptime_pct', body.uptimeMax);
  if (body.disconnectMin != null) query = query.gte('disconnect_count', body.disconnectMin);
  if (body.disconnectMax != null) query = query.lte('disconnect_count', body.disconnectMax);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ rows: data ?? [], totalCount: count ?? 0 });
}
```

## 5. Export generation pattern

The purchase flow should:

1. persist the buyer filter in `dataset_purchases.filter_json`
2. build a query against `dataset_connectivity_daily`
3. generate a CSV of the filtered rows
4. store it to Supabase Storage under `exports/{purchaseId}.csv`
5. update `dataset_purchases.export_path`
6. insert a `dataset_access` record for the buyer

This file is intended to document the exact pattern for the backend implementation.
