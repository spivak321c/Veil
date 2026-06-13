import {
  getDefaultZkProverDeps,
  getCdnZkAssetProvider,
  getATAIntoStealthPoolNoteCreatorProver,
  getETAIntoStealthPoolNoteCreatorProver,
  getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver,
  getUserRegistrationProver,
} from "@umbra-privacy/sdk/zk-prover";
import type {
  ZkAssetProvider,
  ZkAssetUrls,
} from "@umbra-privacy/sdk/zk-prover";
import {
  getIndexedDbZkAssetLoader,
  getIndexedDbZkAssetStorer,
} from "./zk-cache";

const cdnProvider = getCdnZkAssetProvider();
const manifestCache = new Map<string, Promise<ZkAssetUrls>>();

const assetProvider: ZkAssetProvider = {
  getAssetUrls: (type, variant) => {
    const key = variant ? `${type}-${variant}` : type;
    let pending = manifestCache.get(key);
    if (!pending) {
      pending = cdnProvider.getAssetUrls(type, variant);
      manifestCache.set(key, pending);
    }
    return pending;
  },
};

const deps = {
  ...getDefaultZkProverDeps(),
  assetProvider,
  load: getIndexedDbZkAssetLoader(),
  store: getIndexedDbZkAssetStorer(),
};

export const burnReceiverIntoEncryptedProver =
  getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver(deps);

export const createFromPublicProver =
  getATAIntoStealthPoolNoteCreatorProver(deps);

export const createFromEncryptedProver =
  getETAIntoStealthPoolNoteCreatorProver(deps);

export const registrationProver =
  getUserRegistrationProver(deps);
