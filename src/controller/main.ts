import { nuke } from '@/deploy/nuke';
import { ServerList } from '@/deploy/server-list';
import { NS } from '@ns';

export async function main(ns: NS) {
  ns.disableLog('ALL');

  const target = ns.args[0];

  if (!target || typeof target !== 'string') {
    throw new Error('Please provide a target server as an argument');
  }

  await new App(ns, target).run();
}

class App {
  servers: string[];

  readonly weakenScriptSize: number;
  readonly growScriptSize: number;
  readonly hackScriptSize: number;

  get maxMoney() {
    return this.ns.getServerMaxMoney(this.target);
  }

  get availableMoney() {
    return this.ns.getServerMoneyAvailable(this.target);
  }

  get moneyThreshold() {
    return this.maxMoney * 0.9;
  }

  get numOfWeakenThreadsNeeded() {
    const minSecurityLevel = this.ns.getServerMinSecurityLevel(this.target);

    let i = 0;

    while (this.ns.getServerSecurityLevel(this.target) - this.ns.weakenAnalyze(i) < minSecurityLevel) {
      i++;
    }

    return i;
  }

  get totalAvailableThreads() {
    const maxRam = Math.max(this.weakenScriptSize, this.growScriptSize, this.hackScriptSize);

    let totalAvailableThreads = 0;

    for (const server of this.servers) {
      totalAvailableThreads += Math.floor(this.ns.getServerMaxRam(server) / maxRam);
    }

    return totalAvailableThreads;
  }

  get totalUsedThreads() {
    let totalUsedThreads = 0;

    for (const server of this.servers) {
      totalUsedThreads += this.ns.getRunningScript('controller/weaken.js', server, this.target)?.threads || 0;
      totalUsedThreads += this.ns.getRunningScript('controller/grow.js', server, this.target)?.threads || 0;
      totalUsedThreads += this.ns.getRunningScript('controller/hack.js', server, this.target)?.threads || 0;
    }

    return totalUsedThreads;
  }

  constructor(private readonly ns: NS, private readonly target: string) {
    this.servers = ServerList.get(this.ns);

    // Setup: Copy scripts and nuke servers
    for (const server of this.servers) {
      this.ns.scp('controller/weaken.js', server);
      this.ns.scp('controller/grow.js', server);
      this.ns.scp('controller/hack.js', server);

      nuke(this.ns, server);
    }

    this.weakenScriptSize = this.ns.getScriptRam('controller/weaken.js');
    this.growScriptSize = this.ns.getScriptRam('controller/grow.js');
    this.hackScriptSize = this.ns.getScriptRam('controller/hack.js');
  }

  async run() {
    while (true) {
      const optimalRatio = this.calculateOptimalRatios();
      const correctThreads = this.calculateCorrectThreads(optimalRatio);
      const currentRatio = this.calculateCurrentThreads();

      const neededWeakenThreads = correctThreads.weaken - currentRatio.weaken;
      const neededGrowThreads = correctThreads.grow - currentRatio.grow;
      const neededHackThreads = correctThreads.hack - currentRatio.hack;

      this.ns.print(
        `Threads needed - Weaken: ${neededWeakenThreads}, Grow: ${neededGrowThreads}, Hack: ${neededHackThreads}`,
      );
      this.ns.print(`${this.totalUsedThreads}/${this.totalAvailableThreads} threads in use`);

      this.addWeakenThread(neededWeakenThreads);
      this.addGrowThread(neededGrowThreads);
      this.addHackThread(neededHackThreads);

      await this.ns.sleep(1000);
    }
  }

  calculateOptimalRatios() {
    const weakenThreadsNeeded = this.numOfWeakenThreadsNeeded;
    const growThreadsNeeded = Math.ceil(this.ns.growthAnalyze(this.target, this.maxMoney / this.availableMoney));
    const hackThreadsNeeded = Math.floor(this.ns.hackAnalyzeThreads(this.target, this.moneyThreshold));

    const totalThreads = weakenThreadsNeeded + growThreadsNeeded + hackThreadsNeeded;

    return {
      weaken: weakenThreadsNeeded / totalThreads,
      grow: growThreadsNeeded / totalThreads,
      hack: hackThreadsNeeded / totalThreads,
    };
  }

  calculateCurrentThreads() {
    let weakenThreads = 0;
    let growThreads = 0;
    let hackThreads = 0;

    for (const server of this.servers) {
      weakenThreads += this.ns.getRunningScript('controller/weaken.js', server, this.target)?.threads || 0;
      growThreads += this.ns.getRunningScript('controller/grow.js', server, this.target)?.threads || 0;
      hackThreads += this.ns.getRunningScript('controller/hack.js', server, this.target)?.threads || 0;
    }

    return {
      weaken: weakenThreads,
      grow: growThreads,
      hack: hackThreads,
    };
  }

  calculateCorrectThreads(optimalRatios: { weaken: number; grow: number; hack: number }) {
    return {
      weaken: Math.floor(optimalRatios.weaken * this.totalAvailableThreads),
      grow: Math.floor(optimalRatios.grow * this.totalAvailableThreads),
      hack: Math.floor(optimalRatios.hack * this.totalAvailableThreads),
    };
  }

  getAvailableServerRam(server: string) {
    return this.ns.getServerMaxRam(server) - this.ns.getServerUsedRam(server);
  }

  possibleThreadsForScript(server: string, scriptSize: number) {
    return Math.floor(this.getAvailableServerRam(server) / scriptSize);
  }

  addWeakenThread(threadsNeeded: number) {
    let threadsToAdd = Math.ceil(threadsNeeded);

    for (const server of this.servers) {
      if (threadsToAdd <= 0) {
        return;
      }

      const threadsForServer = Math.min(
        this.possibleThreadsForScript(server, this.weakenScriptSize),
        this.totalAvailableThreads,
      );

      if (threadsForServer <= 0) {
        continue;
      }

      this.ns.exec('controller/weaken.js', server, threadsForServer, this.target);
      threadsToAdd -= threadsForServer;
      this.ns.print(`Added ${threadsForServer} weaken threads on ${server} targeting ${this.target}`);
    }
  }

  addGrowThread(threadsNeeded: number) {
    let threadsToAdd = Math.ceil(threadsNeeded);

    for (const server of this.servers) {
      if (threadsToAdd <= 0) {
        return;
      }

      const threadsForServer = Math.min(this.possibleThreadsForScript(server, this.growScriptSize), threadsToAdd);

      if (threadsForServer <= 0) {
        continue;
      }

      this.ns.exec('controller/grow.js', server, threadsForServer, this.target);
      threadsToAdd -= threadsForServer;
      this.ns.print(`Added ${threadsForServer} grow threads on ${server} targeting ${this.target}`);
    }
  }

  addHackThread(threadsNeeded: number) {
    let threadsToAdd = Math.ceil(threadsNeeded);

    for (const server of this.servers) {
      if (threadsToAdd <= 0) {
        return;
      }

      const threadsForServer = Math.min(this.possibleThreadsForScript(server, this.hackScriptSize), threadsToAdd);

      if (threadsForServer <= 0) {
        continue;
      }

      this.ns.exec('controller/hack.js', server, threadsForServer, this.target);
      threadsToAdd -= threadsForServer;
      this.ns.print(`Added ${threadsForServer} hack threads on ${server} targeting ${this.target}`);
    }
  }
}
