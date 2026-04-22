create extension if not exists pgcrypto;

create table if not exists public.orders (
	id text primary key,
	created_at timestamptz not null default timezone('utc', now()),
	timestamp timestamptz not null,
	network bigint not null,
	status text not null,
	vault text not null,
	key text not null,
	data jsonb not null,
	constraint orders_network_key_key unique (network, key)
);

create index if not exists orders_network_idx
	on public.orders (network);

create index if not exists orders_status_timestamp_idx
	on public.orders (status, timestamp desc);

create index if not exists orders_vault_idx
	on public.orders (vault);

create index if not exists orders_data_gin_idx
	on public.orders using gin (data);
create extension if not exists pgcrypto;

create table if not exists public.orders (
	id text primary key,
	created_at timestamptz not null default timezone('utc', now()),
	timestamp timestamptz not null,
	status text not null,
	network bigint not null,
	vault text not null,
	key text not null,
	data jsonb not null,
	constraint orders_network_key_key unique (network, key)
);

create index if not exists orders_network_idx
	on public.orders (network);

create index if not exists orders_status_idx
	on public.orders (status);

create index if not exists orders_timestamp_idx
	on public.orders (timestamp desc);

create index if not exists orders_data_gin_idx
	on public.orders using gin (data);