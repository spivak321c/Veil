// Debug script to compute hashes using the SDK's Poseidon implementation
// Run: node debug_hash.cjs
// OR: bun run debug_hash.cjs

const path = require("path");
const sdkRoot = path.join(
  __dirname,
  "node_modules",
  ".bun",
  "@umbra-privacy+sdk@5.0.0-rc.3+1ee9836e792b279d",
  "node_modules",
  "@umbra-privacy",
  "sdk",
  "dist"
);

const { getPoseidonHasher, getPoseidonAggregator } = require(path.join(sdkRoot, "index.cjs"));

async function main() {
  const hasher = getPoseidonHasher();
  const aggregator = getPoseidonAggregator();

  // === Known inputs from debug logs ===

  // h1 components (15 values)
  const version = 1n;
  const commitmentIndex = 1404n;
  const senderAddressLow = 292969528757468551016177114883649705215n;
  const senderAddressHigh = 81125728766310412932526438031483519681n;
  const relayerFixedSolFees = 1224960n;
  const mintAddressLow = 264574109273178632340438166610226736184n;
  const mintAddressHigh = 303894705537847742114874901617979954274n;
  const utxoYear = 2026n;
  const utxoMonth = 6n;
  const utxoDay = 5n;
  const utxoHour = 23n;
  const utxoMinute = 24n;
  const utxoSecond = 59n;
  const poolVolumeSpl = 12719335021n;
  const poolVolumeSol = 167819520n;

  // h2 components (6 values)
  const amount = 10000000n;
  const nullifier = 5947584936590662340545980161251731016092777389684240460898315436953194596349n;
  const h2BlindingFactor = 14098849368901719050775160604427078258004880268896790885846554937895000711558n;
  const finalDestinationAddressLow = 4536376573311451502693728151233997873n;
  const finalDestinationAddressHigh = 198846914753513652527918691997301368175n;

  // user commitment keys
  const mvk = 3867612322325860776363469710796769726358858643388575658217525506167828710153n;
  const mvkBlinding = 19278871719805214397475686391266912917241138134388523977991540685360694062259n;
  const privateKey = 8073694458785290958600502244295118757606782441171486172493826746969443325037n;
  const privateKeyBlinding = 20117584069421007300104838617817463308222567450719015973600865176900272816885n;

  console.log("=== Computing userCommitment ===");
  const leftLeaf = await hasher([mvk, mvkBlinding]);
  const rightLeaf = await hasher([privateKey, privateKeyBlinding]);
  const userCommitment = await hasher([leftLeaf, rightLeaf]);
  console.log("userCommitment:", userCommitment.toString());

  console.log("\n=== Computing h1Hash ===");
  const h1Inputs = [
    version,
    commitmentIndex,
    senderAddressLow,
    senderAddressHigh,
    relayerFixedSolFees,
    mintAddressLow,
    mintAddressHigh,
    utxoYear,
    utxoMonth,
    utxoDay,
    utxoHour,
    utxoMinute,
    utxoSecond,
    poolVolumeSpl,
    poolVolumeSol,
  ];
  console.log("h1 inputs count:", h1Inputs.length);
  for (let i = 0; i < h1Inputs.length; i++) {
    console.log(`  h1[${i}]: ${h1Inputs[i].toString()}`);
  }
  const h1Hash = await aggregator(h1Inputs);
  console.log("h1Hash:", h1Hash.toString());
  // Convert to LE bytes hex
  const h1Hex = h1Hash.toString(16).padStart(64, "0");
  console.log("h1Hash_hex (big-endian):", h1Hex);

  console.log("\n=== Computing h2Hash ===");
  const h2Inputs = [
    amount,
    nullifier,
    userCommitment,
    finalDestinationAddressLow,
    finalDestinationAddressHigh,
    h2BlindingFactor,
  ];
  console.log("h2 inputs count:", h2Inputs.length);
  const h2Hash = await hasher(h2Inputs);
  console.log("h2Hash:", h2Hash.toString());
  const h2Hex = h2Hash.toString(16).padStart(64, "0");
  console.log("h2Hash_hex (big-endian):", h2Hex);

  console.log("\n=== Computing leaf ===");
  const leaf = await hasher([h1Hash, h2Hash]);
  console.log("leaf:", leaf.toString());
  const leafHex = leaf.toString(16).padStart(64, "0");
  console.log("leaf_hex (big-endian):", leafHex);

  // On-chain values
  console.log("\n=== On-chain values (from logs) ===");
  console.log("on-chain h1Hash_hex: 421907eba6f2dc186c1d30fc869a059c10cf594b069c3ad83f200fdaeb9a9e2e");
  console.log("on-chain h2Hash_hex: 7fee35cb8ae3b90d7e0c30054eda58731733a71360971597f2cdcccbc4465627");
  console.log("on-chain leaf_hex:   fc3b92f803370e300833cfc5e931d92d4a6a388f57a9f41cd557bae7f3a7690c");

  console.log("\n=== Comparison ===");
  console.log("SDK h1Hash matches on-chain?", h1Hex === "421907eba6f2dc186c1d30fc869a059c10cf594b069c3ad83f200fdaeb9a9e2e" ? "✅ YES" : "❌ NO");
  console.log("SDK h2Hash matches on-chain?", h2Hex === "7fee35cb8ae3b90d7e0c30054eda58731733a71360971597f2cdcccbc4465627" ? "✅ YES" : "❌ NO");
  console.log("SDK leaf matches on-chain?", leafHex === "fc3b92f803370e300833cfc5e931d92d4a6a388f57a9f41cd557bae7f3a7690c" ? "✅ YES" : "❌ NO");
}

main().catch(console.error);
