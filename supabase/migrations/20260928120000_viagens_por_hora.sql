-- =====================================================================
-- Viagens passam a ser marcadas por hora
--
-- As viagens da equipe sao de taxi e quase sempre ida e volta no mesmo
-- dia, entao o que importa e o horario de saida e de retorno. A data de
-- volta continua existindo para o caso raro de a viagem virar o dia.
--
-- Seguro rodar mais de uma vez.
-- =====================================================================

alter table public.trips
  add column if not exists start_time time,
  add column if not exists end_time   time;

-- Ordena o dia pela hora de saida.
create index if not exists trips_start_idx on public.trips (start_date, start_time);
