# Security & Privacy Policy 🛡️

The **WRAITH** project is designed with a **local-first, privacy-by-default architecture**. We take security, user privacy, and responsible AI deployment seriously.

---

## 1. Local-First Privacy Architecture

WRAITH is purpose-built to preserve personal memories, sensitive diary entries, and historical documents without surrendering them to cloud data brokers or third-party inference APIs.

- **Zero Remote Telemetry:** No memory input, generated story, or analytical metadata is ever transmitted to remote cloud servers, analytics providers, or advertising trackers.
- **On-Device Inference:** All neural network computations execute locally on the user's hardware through Ollama using local open weights (`gemma4:e2b`).
- **Offline Capability:** Once dependencies and model weights are downloaded locally, WRAITH operates entirely disconnected from the Internet.
- **Client-Side Persistence:** Saved memories reside in the user's browser `localStorage` sandbox. No remote database or persistent external service holds user entries.

---

## 2. Prompt Injection & Input Boundary Protections

User submissions may contain arbitrary historical text, transcribed letters, or unstructured notes. To prevent prompt injection and unauthorized execution:

1. **Strict Context Isolation:** Submissions are treated strictly as untrusted historical data, never as executable code or system instructions.
2. **Payload Size Boundaries:** Requests are strictly capped at 6,000 characters to prevent buffer exhaustion and out-of-memory denial-of-service conditions on modest hardware.
3. **Structured JSON Validation:** Model output is required in strict JSON format. Any anomalous text, conversational preamble, or markdown execution is safely rejected and normalized.
4. **No External Execution:** The backend does not trigger filesystem manipulation, shell commands, or external network requests on the basis of memory contents.

---

## 3. Storage & Client-Side Considerations

- **Browser localStorage:** Entries in `localStorage` are scoped to the host domain (`http://localhost:3000`). While protected from cross-origin requests by the browser's Same-Origin Policy (SOP), `localStorage` is not encrypted at rest on the local disk. Users running WRAITH on shared public computers should clear browser archives upon conclusion of their session.
- **Environment Configuration:** All sensitive ports and host definitions are managed via `.env` files and `.gitignore` to prevent inadvertent credential leakage.

---

## 4. Reporting a Security Vulnerability

If you discover a security vulnerability or bug within the WRAITH codebase:

1. **Do not create a public GitHub issue.**
2. Send a detailed report describing the vulnerability, proof of concept, and affected versions to:
   - **Email:** `security@wraith-archive.local` (or repository maintainers via GitHub Security Advisories)
3. Please include:
   - Operating System and environment details
   - Node.js and Ollama versions
   - Exact steps or memory payload to reproduce the issue
   - Expected vs. actual behavior

We appreciate your responsible disclosure and will acknowledge receipt within 48 hours.
