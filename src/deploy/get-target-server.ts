import { NS } from '@ns';

export async function getTargetServer(ns: NS, servers: string[]): Promise<string> {
  const orderedServers = servers
    .filter((s) => ns.getServerRequiredHackingLevel(s) <= ns.getHackingLevel() / 2)
    .sort((a, b) => {
      return ns.getServerMaxMoney(b) - ns.getServerMaxMoney(a);
    });

  return orderedServers[0];
}
