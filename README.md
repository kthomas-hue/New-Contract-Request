# Relay

Client-specific contract request forms and approval workflows.

## What it does

- **Admin portal** — configure each client’s request form, roles/people, and multi-step workflow (approval, contract drafting, document review loops, issue for signature, confirm signed).
- **Templates & clone** — start from Full contract / Simple approval / Contractor / Blank, or clone an existing client.
- **Flexible forms** — sections, text, email, phone, URL, currency, date, dropdown, multi-select, checkbox, defaults, half/full width.
- **Flexible workflows** — step types, role or specific-user assignees, edit/comment/upload/request-changes, decline ends or sends back, notify-on-enter/complete.
- **Requests** — submitters fill a dynamic form; assignees review, edit, comment, approve/decline, upload Word drafts, request changes, and notify the right people.
- **Notifications & inbox** — people are notified when a step starts or completes.

## Demo users

Use the header switcher:

1. **Jordan Lee** — submit a Client A request  
2. **Sam Rivera** — approve (edit/comment)  
3. Check notifications for Jordan, Casey (payroll), Riley (contracts)  
4. **Riley Brooks** — draft/upload contract → **Taylor Quinn** review (request changes / approve) → issue → confirm signed  

Client B has a shorter contractor path to show per-client configuration.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build      # production build
npm run test:e2e   # workflow smoke test
```

Data is stored in `data/store.json` (created on first run). Use **Reset demo** in the header to restore seed data.
