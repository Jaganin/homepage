---
title: Jeedom
description: Jeedom Widget Configuration
---

Learn more about [Jeedom](https://www.jeedom.com).

The API key can be found in **Settings → System → Configuration → API** tab.

Allowed fields: `["lights", "temp_int", "temp_ext", "messages", "updates"]`.

- **lights**: number of lights currently on (requires [Jeedom summaries](https://doc.jeedom.com/en_US/core/4.4/dashboard) to be configured for the `light` category).
- **temp_int** / **temp_ext**: temperature values read from specific command IDs. Requires `temp_int_cmd_id` and `temp_ext_cmd_id` to be set. Command IDs can be found via **Tools → Equipment**, then inspecting the command URL or using the Jeedom JSON-RPC API.
- **messages**: number of messages in the Jeedom message center.
- **updates**: number of plugins or core updates available.

```yaml
widget:
  type: jeedom
  url: http://jeedom.host.or.ip
  apikey: your-api-key
  fields: ["lights", "messages", "updates"]
```

With optional temperature fields:

```yaml
widget:
  type: jeedom
  url: http://jeedom.host.or.ip
  apikey: your-api-key
  fields: ["lights", "temp_int", "temp_ext", "messages", "updates"]
  temp_int_cmd_id: 862
  temp_ext_cmd_id: 701
```
