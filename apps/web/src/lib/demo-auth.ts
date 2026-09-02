import type { Persona } from "./types";

/**
 * Local-only accounts for the standalone mock-data demo. These are never used
 * when Supabase credentials are configured.
 */
export const DEMO_ACCOUNTS: Array<Persona & { password: string; description: string }> = [
  {
    id: "demo-citizen",
    userId: "demo-citizen",
    name: "Ananya Sharma",
    email: "ananya@fixwise.demo",
    password: "Citizen@123",
    role: "CITIZEN",
    label: "Ananya Sharma",
    description: "Citizen account",
  },
  {
    id: "demo-municipality-admin",
    userId: "demo-municipality-admin",
    name: "Rahul Kulkarni",
    email: "rahul@fixwise.demo",
    password: "Municipal@123",
    role: "MUNICIPALITY_ADMIN",
    municipalityId: "m-pmc",
    label: "Rahul Kulkarni",
    description: "Pune Municipal Corporation admin",
  },
  {
    id: "demo-department-admin",
    userId: "demo-department-admin",
    name: "Sneha Patil",
    email: "sneha@fixwise.demo",
    password: "Department@123",
    role: "DEPARTMENT_ADMIN",
    municipalityId: "m-pcmc",
    departmentKey: "sanitation",
    label: "Sneha Patil",
    description: "PCMC sanitation administrator",
  },
  {
    id: "demo-super-admin",
    userId: "demo-super-admin",
    name: "Meera Deshpande",
    email: "meera@fixwise.demo",
    password: "Admin@123",
    role: "SUPER_ADMIN",
    label: "Meera Deshpande",
    description: "Platform super administrator",
  },
];

export function findDemoAccount(email: string, password: string) {
  return DEMO_ACCOUNTS.find(
    (account) => account.email.toLowerCase() === email.trim().toLowerCase() && account.password === password,
  );
}
