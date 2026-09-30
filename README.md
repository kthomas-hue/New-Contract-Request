# Relay

Client-specific contract request forms and approval workflows.

## What it does

- **Admin portal** — configure each client’s request form, roles, and multi-step workflow (approval, contract drafting, document review loops, issue for signature, confirm signed).
- **Requests** — submitters fill a dynamic form; assignees review, edit, comment, approve/decline, upload Word drafts, request changes, and notify the right people.
- **Notifications & inbox** — people are notified when a step starts or completes (e.g. payroll on new offer, contracts team to draft, submitter when signed).

## Demo users

Use the header switcher:

1. **Jordan Lee** — submit a Client A request  
2. **Sam Rivera** — approve (edit/comment)  
3. Check notifications for Jordan, Casey (payroll), Riley (contracts)  
4. **Riley Brooks** — draft/upload contract → **Taylor Quinn** review (request changes / approve) → issue → confirm signed  

Client B has a shorter finance-approval → issue path to show per-client configuration.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Data is stored in `data/store.json` (created on first run). Use **Reset demo** in the header to restore seed data.
