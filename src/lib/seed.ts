import { buildClientFromTemplate } from "./templates";
import type { AppStore, User } from "./types";

export const CLIENT_A_ID = "client-a";
export const CLIENT_B_ID = "client-b";

export function createSeedStore(): AppStore {
  const clientA = {
    ...buildClientFromTemplate({
      name: "Client A",
      description:
        "New hire offer → approval → contract draft → review loop → issue → signed.",
      accent: "#1F6F6B",
      template: "full_contract",
    }),
    id: CLIENT_A_ID,
    slug: "client-a",
  };

  const clientB = {
    ...buildClientFromTemplate({
      name: "Client B",
      description:
        "Simpler contractor path — shows how each client can differ.",
      accent: "#3D6B8C",
      template: "contractor",
    }),
    id: CLIENT_B_ID,
    slug: "client-b",
  };

  const users: User[] = [
    {
      id: "user-admin",
      name: "Alex Morgan",
      email: "alex@northline.team",
      title: "Platform Admin",
      isAdmin: true,
      clientRoles: {
        [CLIENT_A_ID]: ["role-contracts"],
        [CLIENT_B_ID]: ["role-hr"],
      },
    },
    {
      id: "user-submitter",
      name: "Jordan Lee",
      email: "jordan@clienta.com",
      title: "Hiring Manager",
      isAdmin: false,
      clientRoles: { [CLIENT_A_ID]: ["role-submitter"] },
    },
    {
      id: "user-approver",
      name: "Sam Rivera",
      email: "sam@clienta.com",
      title: "People Lead",
      isAdmin: false,
      clientRoles: { [CLIENT_A_ID]: ["role-approver"] },
    },
    {
      id: "user-payroll",
      name: "Casey Nguyen",
      email: "casey@northline.team",
      title: "Payroll Specialist",
      isAdmin: false,
      clientRoles: {
        [CLIENT_A_ID]: ["role-payroll"],
        [CLIENT_B_ID]: ["role-payroll"],
      },
    },
    {
      id: "user-contracts",
      name: "Riley Brooks",
      email: "riley@northline.team",
      title: "Contracts Associate",
      isAdmin: false,
      clientRoles: {
        [CLIENT_A_ID]: ["role-contracts"],
        [CLIENT_B_ID]: ["role-contracts"],
      },
    },
    {
      id: "user-legal",
      name: "Taylor Quinn",
      email: "taylor@northline.team",
      title: "Legal Counsel",
      isAdmin: false,
      clientRoles: { [CLIENT_A_ID]: ["role-legal"] },
    },
    {
      id: "user-employee",
      name: "Morgan Blake",
      email: "morgan.blake@email.com",
      title: "Incoming Employee",
      isAdmin: false,
      clientRoles: { [CLIENT_A_ID]: ["role-employee"] },
    },
    {
      id: "user-b-submitter",
      name: "Priya Shah",
      email: "priya@clientb.com",
      title: "Talent Partner",
      isAdmin: false,
      clientRoles: { [CLIENT_B_ID]: ["role-submitter"] },
    },
    {
      id: "user-b-approver",
      name: "Chris Okonkwo",
      email: "chris@clientb.com",
      title: "Finance Director",
      isAdmin: false,
      clientRoles: { [CLIENT_B_ID]: ["role-approver"] },
    },
  ];

  return {
    users,
    clients: [clientA, clientB],
    requests: [],
    notifications: [],
    currentUserId: "user-submitter",
  };
}
