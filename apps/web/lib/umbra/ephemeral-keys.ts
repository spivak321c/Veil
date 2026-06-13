import { kmac256 } from "@noble/hashes/sha3-addons.js";

const DOMAIN_PREFIX = "Umbra Privacy";
const PURE_PERSONALIZATION = new TextEncoder().encode(
  "umbra/1.0.0|kmac256/1.0.0|kdf/1.0.0|pure"
);
const MAX_252_BIT_VALUE = (1n << 252n) - 1n;

const BN254_PRIME_LIMBS = [
  0x43e1f593f0000001n,
  0x2833e84879b97091n,
  0xb85045b68181585dn,
  0x30644e72e131a029n,
];
const BN254_FIELD_PRIME =
  BN254_PRIME_LIMBS[3] * (1n << 192n) +
  BN254_PRIME_LIMBS[2] * (1n << 128n) +
  BN254_PRIME_LIMBS[1] * (1n << 64n) +
  BN254_PRIME_LIMBS[0];

function bigintFromBE(bytes: Uint8Array): bigint {
  let result = 0n;
  for (const b of bytes) {
    result = (result << 8n) | BigInt(b);
  }
  return result;
}

function bn254FieldElementSampler(bytes64: Uint8Array): bigint {
  return bigintFromBE(bytes64) % BN254_FIELD_PRIME;
}

async function expandModifiedGenerationIndex(
  bytes16: Uint8Array
): Promise<Uint8Array> {
  const domain = new TextEncoder().encode(
    `${DOMAIN_PREFIX} - ExpandedGenerationIndex`
  );
  return kmac256(domain, bytes16, {
    dkLen: 32,
    personalization: PURE_PERSONALIZATION,
  });
}

function buildPersonalizationString(client: {
  versions: {
    protocol: () => { name: string; version: string };
    algorithm: () => { name: string; version: string };
    scheme: () => { name: string; version: string };
    network: () => string;
  };
}): Uint8Array {
  const protocol = client.versions.protocol();
  const algorithm = client.versions.algorithm();
  const scheme = client.versions.scheme();
  const network = client.versions.network();
  const personalizationString = `${protocol.name}/${protocol.version}|${algorithm.name}/${algorithm.version}|${scheme.name}/${scheme.version}|${network}`;
  return new TextEncoder().encode(personalizationString);
}

async function deriveEphemeralKey(
  client: Parameters<typeof buildPersonalizationString>[0],
  domainString: string,
  masterSeed: Uint8Array,
  offset: bigint
): Promise<bigint> {
  const domainSeparator = new TextEncoder().encode(
    `${DOMAIN_PREFIX} - ${domainString} - ${offset.toString()}`
  );
  const personalization = buildPersonalizationString(client);
  const u512Bytes = await kmac256(domainSeparator, masterSeed, {
    dkLen: 64,
    personalization,
  });
  const fieldElement = bn254FieldElementSampler(u512Bytes);
  return fieldElement & MAX_252_BIT_VALUE;
}

export interface EphemeralKeys {
  masterViewingKey: bigint;
  masterViewingKeyBlindingFactor: bigint;
  poseidonPrivateKey: bigint;
  poseidonPrivateKeyBlindingFactor: bigint;
}

export async function computeEphemeralKeys(
  client: Parameters<typeof buildPersonalizationString>[0] & {
    masterSeed: { getMasterSeed: () => Promise<Uint8Array> };
  },
  modifiedGenerationIndex: Uint8Array
): Promise<EphemeralKeys> {
  const masterSeed = await client.masterSeed.getMasterSeed();

  const expanded = await expandModifiedGenerationIndex(
    modifiedGenerationIndex
  );

  let offset = 0n;
  for (let i = 0; i < 32; i++) {
    offset |= BigInt(expanded[i]) << BigInt(i * 8);
  }

  const [mvk, mvkBf, pk, pkBf] = await Promise.all([
    deriveEphemeralKey(client, "Ephemeral UTXO MasterViewingKey", masterSeed, offset),
    deriveEphemeralKey(client, "Ephemeral UTXO MasterViewingKeyBlindingFactor", masterSeed, offset),
    deriveEphemeralKey(client, "Ephemeral UTXO PoseidonPrivateKey", masterSeed, offset),
    deriveEphemeralKey(client, "Ephemeral UTXO PoseidonPrivateKeyBlindingFactor", masterSeed, offset),
  ]);

  return {
    masterViewingKey: mvk,
    masterViewingKeyBlindingFactor: mvkBf,
    poseidonPrivateKey: pk,
    poseidonPrivateKeyBlindingFactor: pkBf,
  };
}
