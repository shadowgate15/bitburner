import { NS } from '@ns';
import { getTargetServer } from './deploy/get-target-server';
import { ServerList } from './deploy/server-list';

export async function main(ns: NS) {
  const servers = ServerList.get(ns);
  const targetServer = await getTargetServer(ns, servers);

  ns.tprint(`Deploying "hack.js" targeting: "${targetServer}" to ${servers.length} servers: ${servers.join(', ')}`);

  for (const server of servers) {
    const threadCount = getThreadCount(ns, server);

    if (threadCount <= 0) {
      ns.tprint(
        `Not enough RAM to deploy hack.js to ${server} (requires ${SCRIPT_RAM} GB, has ${ns.getServerMaxRam(
          server,
        )} GB)`,
      );
      continue;
    }

    ns.tprint(`Deploying hack.js to ${server} with ${threadCount} threads...`);

    ns.scp('hack.js', server);

    ns.brutessh(server);
    ns.nuke(server);

    ns.kill('hack.js', server);
    ns.exec('hack.js', server, threadCount, targetServer);
    ns.tprint(`Deployed hack.js to ${server} with ${threadCount} threads!`);
  }
}

let SCRIPT_RAM: number | null = null;
function getThreadCount(ns: NS, server: string): number {
  if (!SCRIPT_RAM) {
    SCRIPT_RAM = ns.getScriptRam('hack.js');
  }

  const maxRam = ns.getServerMaxRam(server);

  return Math.floor(maxRam / SCRIPT_RAM);
}
