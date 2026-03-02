import { nuke } from '@/deploy/nuke';
import { ServerList } from '@/deploy/server-list';
import { NS } from '@ns';

const GROW_SCRIPT = 'batch/grow.js';
const WEAKEN_SCRIPT = 'batch/weaken.js';
const HACK_SCRIPT = 'batch/hack.js';

export class ThreadCoordinator {
  private get servers() {
    return ServerList.get(this.ns);
  }

  constructor(private readonly ns: NS) {}

  /**
   * @returns number of threads that were added, will be -1 if there is not enough RAM on any server to add a single thread
   */
  private tryToAddThreads(
    target: string,
    threads: number,
    script: string,
    delay?: number,
    portNumber?: number,
  ): number {
    const scriptRam = this.ns.getScriptRam(script);

    const server = this.servers.find((s) => this.ns.getServerMaxRam(s) - this.ns.getServerUsedRam(s) > scriptRam);

    if (!server) {
      return -1;
    }

    const threadsToAdd = Math.min(
      threads,
      Math.ceil((this.ns.getServerMaxRam(server) - this.ns.getServerUsedRam(server)) / scriptRam),
    );

    this.ns.scp(script, server);

    nuke(this.ns, server);

    const args = [target, delay || 0];

    if (portNumber !== undefined) {
      args.push(portNumber);
    }

    this.ns.exec(script, server, { threads: threadsToAdd }, ...args);

    return threadsToAdd;
  }

  private _makeAddThreadsFunction(script: string) {
    return (target: string, threads: number, delay?: number, portNumber?: number) => {
      let addedThreads = 0;

      while (addedThreads < threads) {
        const result = this.tryToAddThreads(target, threads - addedThreads, script, delay, portNumber);

        if (result === -1) {
          throw new NotEnoughRamError();
        }

        addedThreads += result;
      }
    };
  }

  readonly addGrowThreads = this._makeAddThreadsFunction(GROW_SCRIPT);
  readonly addWeakenThreads = this._makeAddThreadsFunction(WEAKEN_SCRIPT);
  readonly addHackThreads = this._makeAddThreadsFunction(HACK_SCRIPT);
}

export class NotEnoughRamError extends Error {
  constructor() {
    super('Not enough RAM to add more threads');
  }
}
