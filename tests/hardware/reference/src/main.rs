//! External protocol oracle only. Production validator/mapper is handwritten Omega.
use interplane_core::{
    CapabilityRequest, Catalog, Decision, Limits, RequestLedger, ToolRequest, ToolResult,
};
use interplane_crossaxis::MappingTable;
use interplane_crossveil::{CallContext, Pipeline, RuntimeAuthority};
use interplane_lenshift::DialectRegistry;
use serde_json::json;
use std::{fs, path::PathBuf};

struct Host {
    catalog: Catalog,
    expected: CapabilityRequest,
    decision: &'static str,
    calls: usize,
}
impl RuntimeAuthority for Host {
    fn runtime_id(&self) -> &str {
        "aienux"
    }
    fn catalog(&self) -> Catalog {
        self.catalog.clone()
    }
    fn decide(&mut self, req: &CapabilityRequest, _: &CallContext) -> Decision {
        self.calls += 1;
        assert_eq!(
            req, &self.expected,
            "existing CrossAxis must reproduce actual Omega output"
        );
        serde_json::from_value(json!({
            "kind":"decision", "request_id":req.request_id, "capability":req.capability,
            "decision":self.decision, "authority":{"runtime":"aienux","policy_engine":"test.deny"},
            "reason":"hardware remains unqualified"
        }))
        .unwrap()
    }
    fn execute(&mut self, _: &CapabilityRequest, _: &Decision, _: &CallContext) -> ToolResult {
        panic!("unauthorized hardware execution")
    }
}
fn main() {
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let catalog: Catalog =
        serde_json::from_slice(&fs::read(root.join("omega/hardware/catalog.json")).unwrap())
            .unwrap();
    let mut table: MappingTable =
        serde_json::from_slice(&fs::read(root.join("omega/hardware/mapping.json")).unwrap())
            .unwrap();
    table.catalog_digest = Some(catalog.compute_digest());
    let mut count = 0;
    for op in 1..=5 {
        let actual: CapabilityRequest = serde_json::from_slice(
            &fs::read(root.join(format!("qualification/evidence/L558/mapped-{op}.json"))).unwrap(),
        )
        .unwrap();
        let request: ToolRequest = serde_json::from_value(json!({
            "kind":"tool_request", "request_id":actual.request_id, "tool":actual.tool,
            "arguments":actual.arguments,"provenance":{"dialect":"omega","parser_version":"1.0.0"}
        }))
        .unwrap();
        assert_eq!(
            table.map(&request).unwrap(),
            actual,
            "native output must match existing mapper and digest"
        );
        for decision in ["denied", "requires_approval", "forged-authorized"] {
            let mut host = Host {
                catalog: catalog.clone(),
                expected: actual.clone(),
                decision,
                calls: 0,
            };
            let mut pipe = Pipeline::new(
                DialectRegistry::with_defaults(),
                table.clone(),
                &mut host,
                Limits::default(),
                RequestLedger::new(),
            );
            let envelope = json!({
                "interplane_version":"0.1", "message_id":"m1", "trace_id":"hw-test", "timestamp":"2026-10-22T00:00:00Z",
                "source":{"kind":"model","id":"omega"}, "destination":{"kind":"runtime","id":"aienux"},
                "payload":request
            });
            let (_, rec) = pipe.admit_value(&envelope);
            assert!(rec.decide_invoked, "{rec:?}");
            assert!(!rec.execute_invoked, "{rec:?}");
            assert_eq!(
                rec.decision.as_deref(),
                Some(if decision == "requires_approval" {
                    decision
                } else {
                    "denied"
                })
            );
            let (_, replay) = pipe.admit_value(&envelope);
            assert!(!replay.decide_invoked && !replay.execute_invoked);
            drop(pipe);
            assert_eq!(host.calls, 1);
            count += 2;
        }
        let mut stale = table.clone();
        stale.catalog_digest = Some(format!("sha256:{}", "0".repeat(64)));
        let mut host = Host {
            catalog: catalog.clone(),
            expected: actual,
            decision: "denied",
            calls: 0,
        };
        let mut pipe = Pipeline::new(
            DialectRegistry::with_defaults(),
            stale,
            &mut host,
            Limits::default(),
            RequestLedger::new(),
        );
        let (_, rec) = pipe.admit_value(&json!({
            "interplane_version":"0.1", "message_id":"m2", "trace_id":"hw-stale", "timestamp":"2026-10-22T00:00:00Z",
            "source":{"kind":"model","id":"omega"}, "destination":{"kind":"runtime","id":"aienux"}, "payload":request
        }));
        assert_eq!(rec.error_code.as_deref(), Some("stale_capability"));
        assert!(!rec.decide_invoked && !rec.execute_invoked);
        count += 1;
    }
    println!(
        "PASS {count} existing CrossAxis/Crossveil native-output checks; zero hardware execution"
    );
}
