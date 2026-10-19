# Custom changes (fork of databk/rustdesk-console)

Branch: `feat/device-last-ip-and-account`
Upstream: https://github.com/databk/rustdesk-console

These changes exist only in this fork. Keep this list in sync so upstream merges
can be reviewed file by file.

## Feature

Device management shows, and can search by:

- last connection IP of the device
- the computer account currently logged into the device (sysinfo `username`)
- the device name / hostname (sysinfo `hostname`)

## Changed files

| File | Change |
| --- | --- |
| `src/common/entities/peer.entity.ts` | new nullable `lastIp` column (`varchar(45)`) on `peers` |
| `src/migrations/1792000000000-AddPeerLastIp.ts` | **new** migration adding `peers.lastIp` (sqlite + mysql) |
| `src/database/data-source-options.ts` | registers the migration above (2 lines) |
| `src/modules/heartbeat/heartbeat.controller.ts` | resolves the device source IP (`X-Forwarded-For` → `X-Real-IP` → `req.ip`) and passes it to the service |
| `src/modules/heartbeat/heartbeat.service.ts` | `handleHeartbeat(data, clientIp?)`; stores `lastIp` for new and existing peers |
| `src/modules/heartbeat/services/heartbeat-cache.service.ts` | `BufferedPeerUpdate.lastIp`; flush skips the field when unknown so an existing IP is not nulled |
| `src/modules/device-group/dto/device.dto.ts` | `DeviceQueryDto.ip` (fuzzy) |
| `src/modules/device-group/dto/peer.dto.ts` | `PeerQueryDto.device_name` / `device_username` / `ip` |
| `src/modules/device-group/device-group.service.ts` | `getDevices()`: selects `peer.lastIp`, returns `info.ip`, adds the `ip` filter |
| `src/modules/device-group/peer.service.ts` | `getAccessiblePeers()`: returns real `info.ip`, adds `device_name` / `device_username` / `ip` filters |

`device_name` and `device_username` filters already existed in `getDevices()`; only
the wire-up on `/api/peers` and the IP plumbing are new.

## Notes

- The IP is captured from the heartbeat request. Behind the bundled nginx proxy
  the value comes from `X-Forwarded-For` (first hop), then `X-Real-IP`.
- IPv6-mapped IPv4 values are stored without the `::ffff:` prefix; length is
  capped at 45 characters.
- Devices that have not sent a heartbeat since this change show an empty IP
  until their next heartbeat.

## Syncing with upstream without losing these changes

```bash
git remote add upstream https://github.com/databk/rustdesk-console.git
git fetch upstream

# keep your own work on the feature branch, main mirrors upstream
git switch main
git merge --ff-only upstream/main      # or: gh repo sync
git push origin main

git switch feat/device-last-ip-and-account
git rebase main                        # replay your commits on top of upstream
# fix conflicts, then:
git push --force-with-lease origin feat/device-last-ip-and-account
```

Rules that keep this painless:

1. Never commit custom work to `main` — `main` stays a mirror of upstream.
2. Keep custom work on the feature branch and rebase (do not merge `main` into
   it repeatedly).
3. The only upstream files touched are listed above; a conflict elsewhere means
   upstream moved code, so re-check this table first.
