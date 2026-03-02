import { NS } from '@ns';

export function getTargetServer(ns: NS, servers: string[]): string {
  const orderedServers = servers
    .filter((s) => {
      // This way if our hacking level is 1, we can still hack servers that require a hacking level of 1
      let hackingLevel = ns.getHackingLevel();

      if (hackingLevel !== 1) {
        hackingLevel = hackingLevel / 2;
      }

      return ns.getServerRequiredHackingLevel(s) <= hackingLevel;
    })
    .sort((a, b) => {
      return scoreServer(ns, b) - scoreServer(ns, a);
    });

  return orderedServers[0];
}

function scoreServer(ns: NS, server: string): number {
  return ns.getServerMaxMoney(server) / ns.getServerMinSecurityLevel(server);
}
