import { notFound } from "next/navigation";
import { AccountView } from "@/components/bank/AccountView";

const ACCOUNT_IDS = ["current", "savings"] as const;

export function generateStaticParams() {
  return ACCOUNT_IDS.map((account) => ({ account }));
}

export default async function AccountPage(props: PageProps<"/accounts/[account]">) {
  const { account } = await props.params;
  if (account !== "current" && account !== "savings") notFound();
  return <AccountView account={account} />;
}
