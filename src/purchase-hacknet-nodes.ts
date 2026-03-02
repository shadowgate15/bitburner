import { NS } from '@ns';

export async function main(ns: NS) {
  while (true) {
    if (ns.hacknet.purchaseNode() === -1) {
      for (let i = 0; i < ns.hacknet.numNodes(); i++) {
        if (ns.hacknet.upgradeCore(i)) break;

        if (ns.hacknet.upgradeRam(i)) break;

        if (ns.hacknet.upgradeLevel(i)) break;
      }
    }

    await ns.sleep(1000);
  }
}
