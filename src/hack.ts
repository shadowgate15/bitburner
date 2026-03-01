import { NS } from '@ns';

// Defines the "target server", which is the server
// that we're going to hack.
const TARGET_SERVER = 'nectar-net';

export async function main(ns: NS) {
  // Defines how much money a server should have before we hack it
  // In this case, it is set to the maximum amount of money.
  const moneyThresh = ns.getServerMaxMoney(TARGET_SERVER);

  // Defines the minimum security level the target server can
  // have. If the target's security level is higher than this,
  // we'll weaken it before doing anything else
  const securityThresh = ns.getServerMinSecurityLevel(TARGET_SERVER);

  // If we have the BruteSSH.exe program, use it to open the SSH Port
  // on the target server
  if (ns.fileExists('BruteSSH.exe', 'home')) {
    ns.brutessh(TARGET_SERVER);
  }

  // Get root access to target server
  ns.nuke(TARGET_SERVER);

  // Infinite loop that continously hacks/grows/weakens the target server
  while (true) {
    if (ns.getServerSecurityLevel(TARGET_SERVER) > securityThresh) {
      // If the server's security level is above our threshold, weaken it
      await ns.weaken(TARGET_SERVER);
    } else if (ns.getServerMoneyAvailable(TARGET_SERVER) < moneyThresh) {
      // If the server's money is less than our threshold, grow it
      await ns.grow(TARGET_SERVER);
    } else {
      // Otherwise, hack it
      await ns.hack(TARGET_SERVER);
    }
  }
}
