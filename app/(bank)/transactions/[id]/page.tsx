import { TransactionDetail } from "@/components/bank/TransactionDetail";
import { SCENARIO } from "@/lib/data/scenario";

export function generateStaticParams() {
  return SCENARIO.map((t) => ({ id: t.id }));
}

export default async function TransactionPage(props: PageProps<"/transactions/[id]">) {
  const { id } = await props.params;
  return <TransactionDetail id={id} />;
}
