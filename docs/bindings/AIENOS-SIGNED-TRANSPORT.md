# Proposed Vectorveil remote transport binding: the AienOS signed transport

Status: **proposed, not normative.** Nothing in either SDK implements it; `STATUS.md` says so. The
implementation lives in AienOS (aien-dev/aienos, branch `feat/aienos-interplane-join`,
`native/net/aienos_ipj.{h,c}` and `docs/INTERPLANE_JOIN.md`).

`spec/VECTORVEIL.md` reserves two things: `signature` (origin proof, never authority) and remote transport
bindings, and says adding either must not change the envelope's required fields. This binding uses both
reservations and changes no schema.

## What crosses the wire

An Interplane envelope (`envelope.schema.json`), serialized as JCS canonical JSON, is the payload of one
AienOS signed message of kind 2 (`IPJ_MSG_INTERPLANE`). The signed message is:

```
0 "AIPM"  4 version 1  5 kind = 2  6 ttl  7 reserved 0  8 origin_pk[32]  40 dest_pk[32]
72 seq u64 (big-endian)  80 len u16  82 reserved u16 = 0  84 envelope JCS bytes[len]
then Ed25519(origin machine key, "AIENOS-IPJ-v1 msg\0" | message with ttl taken as 0)
```

It is carried inside an M6-B secure session record (mutually authenticated, AES-256-GCM-SIV, replay window)
between two members of the owner-signed AienOS roster, and may be relayed by other members. A relay can lower
`ttl` and change nothing else. Envelopes up to 951 bytes fit one message in v1.

## What the signature means (unchanged Interplane rule)

- It proves which roster machine wrote the envelope bytes. It never proves the action is authorized.
- The destination runtime runs the envelope through its own pipeline and policy exactly as if it had arrived
  in-process. `decision` envelopes from a remote machine are evidence of that machine's decision, never a
  grant on the receiving runtime.
- Replay at this layer is refused per origin sequence number. Interplane's own `message_id` / `trace_id`
  replay rules still apply on top.

## Mapping

| Envelope field | Binding |
|---|---|
| `source` / `destination` (Party) | The runtime parties inside the machines; the machines themselves are `origin_pk` / `dest_pk`. A runtime should record the origin machine id (`SHA-256("AIENOS-IPJ-v1 machine id\0" | origin_pk)[0..16)`) as provenance of the input it registers. |
| `trace_id`, `message_id`, `parent_id` | Unchanged; end to end. |
| exposure / trust | Content that arrived from another machine is not `trusted_runtime` on the receiver: the receiver assigns trust (Crossveil rule) and should treat it as at most `user_supplied` when the origin machine is the owner's own operator console key, otherwise `external_untrusted`. |

## Open questions (for a later spec revision)

1. Envelopes larger than one message (fragments or a stream binding).
2. Whether the binding should be named in the envelope (a `binding` hint in an extension) or stay invisible.
3. Conformance fixtures: a signed message vector set (bytes, keys, expected verdicts) that the Rust and Python
   runners could check byte for byte.
