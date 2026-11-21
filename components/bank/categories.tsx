import {
  ArrowRightLeft,
  Bike,
  Bus,
  Clapperboard,
  Cpu,
  HeartPulse,
  House,
  Landmark,
  Lightbulb,
  PiggyBank,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/lib/engine";

/** One icon per engine category. Labels live in messages under bank.categories.<category>. */
export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  salary: Wallet,
  rent: House,
  utilities: Lightbulb,
  phone: Smartphone,
  transport: Bus,
  groceries: ShoppingBasket,
  food_delivery: Bike,
  eating_out: UtensilsCrossed,
  shopping: ShoppingBag,
  entertainment: Clapperboard,
  electronics: Cpu,
  health: HeartPulse,
  own_transfer: ArrowRightLeft,
  savings: PiggyBank,
  pension: Landmark,
  other: Sparkles,
};

export function CategoryIcon({ category, incoming, size = "md" }: { category: Category; incoming?: boolean; size?: "md" | "lg" }) {
  const Icon = CATEGORY_ICON[category];
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full ${
        size === "lg" ? "size-16" : "size-11"
      } ${incoming ? "bg-atlas-pine text-white" : "bg-atlas-sea text-atlas-pine"}`}
    >
      <Icon className={size === "lg" ? "size-7" : "size-5"} strokeWidth={1.75} />
    </span>
  );
}
