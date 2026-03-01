import { NS } from '@ns';

/** The maximum number of ports required to hack a server. */
const PORTS_REQUIRED_THRESHOLD = 1;

export async function main(ns: NS) {
  const servers = ServerList.get(ns);

  ns.tprint(`Deploying hack.js to ${servers.length} servers: ${servers.join(', ')}`);

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
    ns.exec('hack.js', server, threadCount);
    ns.tprint(`Deployed hack.js to ${server} with ${threadCount} threads!`);
  }
}

class ServerList {
  private servers: Set<string> = new Set();

  static get(ns: NS): string[] {
    return new ServerList(ns).getServerList();
  }

  constructor(private readonly ns: NS) {
    // Add purchased servers to the list of servers to hack, since we know we can hack them
    for (const server of this.ns.getPurchasedServers()) {
      this.servers.add(server);
    }
  }

  getServerList(): string[] {
    const visited = new Set<string>();

    const serversToVisit = this.ns.scan('home');
    let server: string | undefined = serversToVisit.pop();

    while (server) {
      if (visited.has(server)) {
        server = serversToVisit.pop();
        continue;
      }

      if (this.shouldIncludeServer(server)) {
        this.servers.add(server);
      }

      serversToVisit.push(...this.ns.scan(server));

      visited.add(server);

      server = serversToVisit.pop();
    }

    // Remote "home" from the list of servers, since we don't want to run hacks on our own server
    this.servers.delete('home');

    return Array.from(this.servers.values());
  }

  shouldIncludeServer(host: string): boolean {
    return this.servers.has(host) || this.ns.getServerNumPortsRequired(host) <= PORTS_REQUIRED_THRESHOLD;
  }

  getServerListRecur(host = 'home') {
    if (this.servers.has(host)) {
      return;
    }

    if (this.ns.getServerNumPortsRequired(host) <= PORTS_REQUIRED_THRESHOLD) {
      this.servers.add(host);
    }

    for (const server of this.ns.scan(host)) {
      this.getServerListRecur(server);
    }
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
