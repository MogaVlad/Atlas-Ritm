import { Suspense } from "react";
import { TransactionDetail } from "@/components/bank/TransactionDetail";
import { SCENARIO } from "@/lib/data/scenario";

export function generateStaticParams() {
  return SCENARIO.map((t) => ({ id: t.id }));
}

/**
 * Not async: the id is awaited inside the Suspense boundary, so the page shell stays static and
 * navigation stays instant (Cache Components). Live purchases (ids not listed above) stream in.
 */
export default function TransactionPage(props: PageProps<"/transactions/[id]">) {
  return (
    <Suspense fallback={null}>
      <Detail params={props.params} />
    </Suspense>
  );
}

async function Detail({ params }: { params: PageProps<"/transactions/[id]">["params"] }) {
  const { id } = await params;
  return <TransactionDetail id={id} />;
}
