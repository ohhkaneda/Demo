export function Header() {
  return (
    <thead className="glass-effect rounded-2xl">
      <tr className="[&>th]:text-sm [&>th]:font-bold [&>th]:text-left [&>th]:py-5 [&>th]:px-2 [&>th]:whitespace-nowrap">
        <th className="!pl-9">Token</th>
        <th>Wallet address</th>
        <th>Token ID</th>
        <th>Primary ENS</th>
        <th>ENS</th>
        <th>Lens</th>
        <th>Farcaster</th>
        {/* <th className=" pr-9">XMTP </th> */}
      </tr>
    </thead>
  );
}
