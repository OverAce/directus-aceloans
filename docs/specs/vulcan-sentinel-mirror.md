# Vulcan primary, sentinel US mirror

**Status:** Both hosts are running `directus/directus:11.15.1` against one Supabase schema. v12 has not started.
**Last verified:** 2026-10-06 for the probes below. Revised 2026-10-11 after review: current configuration and the v12 target are separate.
**Supersedes:** the per-instance `PUBLIC_URL` row in [sentinel-deployment.md](sentinel-deployment.md) (decision of 2026-05-02). The rest of that spec still holds: shared database, shared `KEY`/`SECRET`, per-host Redis, Flows on vulcan only, sentinel compose in this repo, vulcan service defined in EasyPanel.

## Topology

| | vulcan | sentinel |
|---|---|---|
| Role | EU primary. Public site. Runs Flows. | US mirror. Admin and ops. Flows off. |
| Host | EU VPS, EasyPanel on Docker Swarm | Mac mini |
| How a browser reaches it today | `https://data.kironhitel.hu` through `kiron/cf-tunnel-aceloans` | `https://directus.lab.marceldarvas.com` (public), Tailscale `http://sentinel.robin-prometheus.ts.net:8055` (`100.87.60.103`), and on the home LAN `http://sentinel.local:8055` |
| `PUBLIC_URL` today | Not read from the EasyPanel process. The public hostname above answers. | `.env.sentinel` is `https://directus.lab.marceldarvas.com` |
| `PUBLIC_URL` at the v12 boot | `https://data.kironhitel.hu` | `https://data.kironhitel.hu` |
| Image | `11.15.1` | `11.15.1` |
| Database | Supabase `toyorzhdbqthqcnsdjgx`, schema `directus`, user `directus_app` | same database |
| Redis | its own EasyPanel Redis | compose service `aceloans-directus-cache` |

`PUBLIC_URL` is not the access path. It is the URL Directus writes into emails, asset links, and the v12 license binding. The v12 target is one value on both containers: `https://data.kironhitel.hu`. Tailscale and `sentinel.local` stay ways to open the mirror. They are not `PUBLIC_URL`.

Sentinel is not Tailscale-only. On 2026-10-06 `https://directus.lab.marceldarvas.com` returned Directus from the public internet, with the same project as vulcan. Nothing in this repo documents an access layer in front of that hostname. Leave the route in place only with that exposure written down. Do not put the lab hostname in `PUBLIC_URL`.

`AGENTS.md` and `CLAUDE.md` point here for `PUBLIC_URL`. `.env.sentinel.example` still defaults to `http://localhost:8055` so a local copy does not borrow the production URL. `http://sentinel.local:8055` remains the home-LAN way to open sentinel.

## License

Directus 12 binds a license activation to the project database plus `PUBLIC_URL`. Replicas count as one activation only when both match. The Open Innovation Grant allows five activations. The key is the same string on every host. It is stored in 1Password and in the host env. It is not committed.

Apply `LICENSE_KEY` only when booting v12 with `PUBLIC_URL=https://data.kironhitel.hu`. v11 ignores the variable. Activating against the lab hostname, then later changing `PUBLIC_URL`, requires a deactivate while the old value is still set, then a restart and a re-apply. Skipping the deactivate keeps the lab URL occupying a slot, and the instance drops to the core tier when the cached license expires.

Core tier without a valid binding is 3 Studio seats, 25 collections, 5 flows, and no SSO.

## Upgrade window

Stay on `11.15.1` on both hosts until both move together. The first `12.4.1` boot migrates the only production `directus` schema. [docs/playbook.md](../playbook.md) still has the backup/restore drill unchecked. Do not start that boot until the drill has been done.

1. Take a timestamped `pg_dump -n directus` of production. Restore it onto a database that is not the production schema. Boot `directus/directus:12.4.1` against that copy with Flows off and no `LICENSE_KEY`. Abort if that boot fails. Production stays on `11.15.1`, and the rollback is to keep it there.
2. Read `PUBLIC_URL` from the vulcan EasyPanel env and from `.env.sentinel`. Both must be `https://data.kironhitel.hu` before `LICENSE_KEY` is applied. Stop if either is still the lab hostname, a Tailscale name, or `localhost`.
3. Stop the sentinel container. `https://directus.lab.marceldarvas.com` goes down. `https://data.kironhitel.hu` stays up.
4. Set `LICENSE_KEY` on vulcan, then on sentinel. `PUBLIC_URL` is already the value checked in step 2.
5. Boot vulcan on `directus/directus:12.4.1`.
6. Start sentinel again only on `12.4.1`, with the same `PUBLIC_URL` and the same key.

If step 5 fails, restore the dump from step 1 over the production `directus` schema and start `11.15.1` only against that restored schema. Do not start `11.15.1` against a schema the v12 boot has already migrated. There is no rehearsed down-migration.

Target image is `12.4.1`, not `12.4.0`. Liveness after that bump is `GET /server/ping`. Unauthenticated `GET /server/health` stops succeeding on v12. The compose probe in this repo already uses ping. `scripts/setup-directus.sh` still waits on `/server/health` and changes in the same bump.

`@directus/cli` (`d6s`) talks only to Directus 12.2.0 or newer, and the two sides must be the same patch. The first `npm run sync:pull` waits until both hosts are on `12.4.1`.

## Config files

| File | Who reads it |
|---|---|
| `.env.vulcan` | Nobody at runtime. Source copied into the vulcan EasyPanel env. Gitignored. `PUBLIC_URL` is already `https://data.kironhitel.hu`. `LICENSE_KEY` is commented until the v12 boot. `REDIS_HOST` is still the sentinel compose name and must be the EasyPanel Redis hostname before that boot. |
| `.env.sentinel` | `docker-compose.sentinel.yml`. Gitignored. `PUBLIC_URL` is still the lab hostname. |
| EasyPanel `/etc/easypanel` | The running vulcan service. This repo does not own that compose file. |
| `lab-infra-vulcan` | Host access, the `kiron` project, and the tunnel. It records the service name after the service exists. It does not hold env or the license key. |

Shared across both env files: `KEY`, `SECRET`, database user, Cloudinary. Sessions and password resets break if `KEY` or `SECRET` diverge.

## Verified 2026-10-06

- `https://data.kironhitel.hu/server/ping` returned `pong`. `/server/health` returned `{"status":"ok"}` with no credentials, which is v11 behavior.
- `https://directus.lab.marceldarvas.com/server/info` and the vulcan info endpoint returned the same project name (`Kiron Hitel`) and the same logo id (`92978ae4-b91d-4d29-bb67-ab205851dd9d`).
- Sentinel `/server/health` returned `{"status":"warn"}`. Vulcan returned `ok`.
- Tailscale DNS name `sentinel.robin-prometheus.ts.net` at `100.87.60.103`. `sentinel.local` resolved only to LAN addresses `10.0.10.10` and `10.0.20.180`.
