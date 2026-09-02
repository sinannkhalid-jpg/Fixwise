import type { Persona } from "./types";

// Demo personas — stand-in for Supabase Auth sessions. The role switcher in the
// top bar (and /login) selects one of these. Replace with real session data at
// integration time; RBAC checks in pages already read from these.

export const PERSONAS: Persona[] = [
  {
    id: "citizen",
    name: "Ananya Sharma",
    email: "ananya@example.in",
    role: "CITIZEN",
    userId: "u-me",
    label: "Citizen · Ananya Sharma",
  },
  {
    id: "muni-admin",
    name: "Rahul Kulkarni",
    email: "rahul.k@pmc.gov.in",
    role: "MUNICIPALITY_ADMIN",
    userId: "u-adm-pmc",
    municipalityId: "m-pmc",
    label: "Municipality Admin · PMC (Rahul)",
  },
  {
    id: "dept-admin",
    name: "Sneha Patil",
    email: "sneha.p@pcmc.gov.in",
    role: "DEPARTMENT_ADMIN",
    userId: "u-adm-pcmc-san",
    municipalityId: "m-pcmc",
    departmentKey: "sanitation",
    label: "Department Admin · PCMC/Sanitation (Sneha)",
  },
  {
    id: "super-admin",
    name: "Meera Deshpande",
    email: "meera@fixwise.gov.in",
    role: "SUPER_ADMIN",
    userId: "u-adm-super",
    label: "Super Admin · Meera Deshpande",
  },
];

export const ROLE_HOME: Record<string, string> = {
  CITIZEN: "/",
  MUNICIPALITY_ADMIN: "/municipality",
  DEPARTMENT_ADMIN: "/municipality",
  SUPER_ADMIN: "/admin",
};

export function canManageCases(p: Persona | null): boolean {
  return !!p && ["MUNICIPALITY_ADMIN", "DEPARTMENT_ADMIN", "SUPER_ADMIN"].includes(p.role);
}
