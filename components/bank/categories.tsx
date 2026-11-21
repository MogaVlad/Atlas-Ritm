import {
  Bus,
  Clapperboard,
  House,
  Lightbulb,
  PiggyBank,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { BankCategory } from "./mockData";

export const CATEGORY_ICON: Record<BankCategory, LucideIcon> = {
  salary: Wallet,
  rent: House,
  utilities: Lightbulb,
  phone: Smartphone,
  transport: Bus,
  groceries: ShoppingBasket,
  eatingOut: UtensilsCrossed,
  shopping: ShoppingBag,
  entertainment: Clapperboard,
  savings: PiggyBank,
};

/**
 * Display-only marker until lib/engine exposes the essentials list (C2/C4).
 * Matches the persona's essentials: rent, utilities, phone, transport.
 */
export const ESSENTIAL_CATEGORIES: ReadonlySet<BankCategory> = new Set(["rent", "utilities", "phone", "transport"]);
