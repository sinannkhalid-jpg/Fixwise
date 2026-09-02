import type { Persona } from "./types";

export const ROLE_HOME: Record<string, string> = {
  CITIZEN: "/",
  MUNICIPALITY_ADMIN: "/municipality",
  DEPARTMENT_ADMIN: "/municipality",
  SUPER_ADMIN: "/admin",
};

export function canManageCases(p: Persona | null): boolean {
  return !!p && ["MUNICIPALITY_ADMIN", "DEPARTMENT_ADMIN", "SUPER_ADMIN"].includes(p.role);
}
