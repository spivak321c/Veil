// Debug script: compute hashes using SDK's Poseidon implementation
// Usage: node debug_hash.mjs

const CHUNK_URL = new URL(
  "./node_modules/.bun/@umbra-privacy+sdk@5.0.0-rc.3+1ee9836e792b279d/node_modules/@umbra-privacy/sdk/dist/chunk-GHXWAWQJ.js",
  import.meta.url
).href;

const { getPoseidonHasher, getPoseidonAggregator } = await import(CHUNK_URL);

const hasher = getPoseidonHasher();
const aggregator = getPoseidonAggregator();

// --- Known inputs from [useClaim:debug] logs ---

// userCommitment keys
const mvk = 3867612322325860776363469710796769726358858643388575658217525506167828710153n;
const mvkBlinding = 19278871719805214397475686391266912917241138134388523977991540685360694062259n;
const privateKey = 8073694458785290958600502244295118757606782441171486172493826746969443325037n;
const privateKeyBlinding = 20117584069421007300104838617817463308222567450719015973600865176900272816885n;

// h1 components (15 values)
const h1Inputs = [
  1n,  // version
  1404n,  // commitmentIndex
  292969528757468551016177114883649705215n,  // senderAddressLow
  81125728766310412932526438031483519681n,  // senderAddressHigh
  1224960n,  // relayerFixedSolFees
  264574109273178632340438166610226736184n,  // mintAddressLow
  303894705537847742114874901617979954274n,  // mintAddressHigh
  2026n,  // utxoYear
  6n,  // utxoMonth
  5n,  // utxoDay
  23n,  // utxoHour
  24n,  // utxoMinute
  59n,  // utxoSecond
  12719335021n,  // poolVolumeSpl
  167819520n,  // poolVolumeSol
];

// h2 components
const amount = 10000000n;
const nullifier = 5947584936590662340545980161251731016092777389684240460898315436953194596349n;
const h2BlindingFactor = 14098849368901719050775160604427078258004880268896790885846554937895000711558n;
const destLow = 4536376573311451502693728151233997873n;
const destHigh = 198846914753513652527918691997301368175n;

// --- Compute ---

console.log("=== userCommitment ===");
const leftLeaf = await hasher([mvk, mvkBlinding]);
const rightLeaf = await hasher([privateKey, privateKeyBlinding]);
const userCommitment = await hasher([leftLeaf, rightLeaf]);
console.log("leftLeaf:", leftLeaf.toString());
console.log("rightLeaf:", rightLeaf.toString());
console.log("userCommitment:", userCommitment.toString());

console.log("\n=== h1Hash ===");
console.log("h1Inputs:", h1Inputs.map(x => x.toString()));
const h1Hash = await aggregator(h1Inputs);
const h1Hex = h1Hash.toString(16).padStart(64, "0");
console.log("h1Hash:", h1Hash.toString());
console.log("h1Hash_hex:", h1Hex);

console.log("\n=== h2Hash ===");
const h2Inputs = [amount, nullifier, userCommitment, destLow, destHigh, h2BlindingFactor];
console.log("h2Inputs:", h2Inputs.map(x => x.toString()));
const h2Hash = await hasher(h2Inputs);
const h2Hex = h2Hash.toString(16).padStart(64, "0");
console.log("h2Hash:", h2Hash.toString());
console.log("h2Hash_hex:", h2Hex);

console.log("\n=== leaf ===");
const leaf = await hasher([h1Hash, h2Hash]);
const leafHex = leaf.toString(16).padStart(64, "0");
console.log("leaf:", leaf.toString());
console.log("leaf_hex:", leafHex);

function reverseBytes(hex) {
  const bytes = hex.match(/.{2}/g);
  return bytes.reverse().join("");
}

console.log("\n=== Byte-reversed comparison (LE bytes → bigint) ===");
const ON_CHAIN_H1 = "421907eba6f2dc186c1d30fc869a059c10cf594b069c3ad83f200fdaeb9a9e2e";
const ON_CHAIN_H2 = "7fee35cb8ae3b90d7e0c30054eda58731733a71360971597f2cdcccbc4465627";
const ON_CHAIN_LEAF = "fc3b92f803370e300833cfc5e931d92d4a6a388f57a9f41cd557bae7f3a7690c";

// On-chain stores bytes in order (lsb→msb). SDK bigint toString(16) is msb→lsb.
// Byte-reverse SDK hex to get the order matching on-chain display.
const revH1 = reverseBytes(h1Hex);
const revH2 = reverseBytes(h2Hex);
const revLeaf = reverseBytes(leafHex);

console.log("SDK h1Hash (BE→LE) matches on-chain h1Hash?", revH1 === ON_CHAIN_H1 ? "YES ✓" : "NO ✗");
console.log("  SDK (LE): ", revH1);
console.log("  On-chain: ", ON_CHAIN_H1);

console.log("SDK h2Hash (BE→LE) matches on-chain h2Hash?", revH2 === ON_CHAIN_H2 ? "YES ✓" : "NO ✗");
console.log("  SDK (LE): ", revH2);
console.log("  On-chain: ", ON_CHAIN_H2);

console.log("SDK leaf (BE→LE) matches on-chain leaf?", revLeaf === ON_CHAIN_LEAF ? "YES ✓" : "NO ✗");
console.log("  SDK (LE): ", revLeaf);
console.log("  On-chain: ", ON_CHAIN_LEAF);

console.log("\n=== Interpretation ===");
if (revH1 === ON_CHAIN_H1 && revH2 !== ON_CHAIN_H2) {
  console.log("h1Hash matches on-chain (Poseidon is correct for h1).");
  console.log("h2Hash DOES NOT match — the issue is in h2 computation.");
  console.log("Possible causes:");
  console.log("  1. userCommitment differs between deposit time and now");
  console.log("  2. Destination address in h2 changed (deposit vs claim use different destinations)");
  console.log("  3. Another h2 input (amount, nullifier, h2BlindingFactor) changed");
}
if (revH2 === ON_CHAIN_H2) {
  console.log("h2Hash also matches — issue is further downstream.");
}
if (revH1 === ON_CHAIN_H1 && revH2 === ON_CHAIN_H2 && revLeaf !== ON_CHAIN_LEAF) {
  console.log("Both h1 and h2 match, but leaf doesn't — the final leaf hash computation diverges.");
  console.log("leaf = Poseidon([h1Hash, h2Hash]). If h1+h2 inputs match, leaf should match.");
  console.log("This would mean the leaf Poseidon t=3 differs between SDK circuits.");
}
