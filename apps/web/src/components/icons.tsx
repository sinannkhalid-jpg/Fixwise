// String-name → icon lookup so category/department metadata can carry icon names.
import {
  Building2,
  CircleDot,
  CircleHelp,
  CloudRain,
  Construction,
  Droplets,
  Lightbulb,
  Trash2,
  TrafficCone,
  Waves,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  CircleDot,
  Construction,
  Waves,
  CloudRain,
  Trash2,
  Lightbulb,
  Droplets,
  TrafficCone,
  Building2,
  CircleHelp,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = MAP[name] ?? CircleHelp;
  return <Cmp className={className} aria-hidden />;
}
