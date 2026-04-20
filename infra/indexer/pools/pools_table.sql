create extension if not exists pgcrypto;

create table if not exists public.pools (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default timezone('utc', now()),
	timestamp timestamptz not null,
	network bigint not null,
	pool text not null,
	data jsonb not null,
	constraint pools_network_pool_key unique (network, pool)
);

create index if not exists pools_network_idx
	on public.pools (network);

create index if not exists pools_timestamp_idx
	on public.pools (timestamp desc);

create index if not exists pools_data_gin_idx
	on public.pools using gin (data);