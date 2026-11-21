import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccountView } from "@/components/bank/AccountView";

const ACCOUNT_IDS = ["current", "savings"] as const;

export function generateStaticParams() {
  return ACCOUNT_IDS.map((account) => ({ account }));
}

/** Not async: the account is awaited inside the Suspense boundary, so navigation stays instant. */
export default function AccountPage(props: PageProps<"/accounts/[account]">) {
  return (
    <Suspense fallback={null}>
      <Account params={props.params} />
    </Suspense>
  );
}

async function Account({ params }: { params: PageProps<"/accounts/[account]">["params"] }) {
  const { account } = await params;
  if (account !== "current" && account !== "savings") notFound();
  return <AccountView account={account} />;
}
