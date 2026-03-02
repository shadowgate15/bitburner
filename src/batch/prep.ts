import { NS } from '@ns';
import { NotEnoughRamError, ThreadCoordinator } from './thread-coordinator';

export async function prep(ns: NS, target: string) {
  const maxMoney = ns.getServerMaxMoney(target);
  const minSecurity = ns.getServerMinSecurityLevel(target);

  const runPrep = async () => {
    const threadCoordinator = new ThreadCoordinator(ns);

    const currentMoney = ns.getServerMoneyAvailable(target);

    const growMultiplier = currentMoney > 0 ? maxMoney / currentMoney : maxMoney;
    const growThreads = Math.ceil(ns.growthAnalyze(target, growMultiplier));
    const growSecurityIncrease = ns.growthAnalyzeSecurity(growThreads, target);

    const currentSecurity = ns.getServerSecurityLevel(target);
    const securityToReduce = currentSecurity - minSecurity;

    const weakenThreadsForGrow = (() => {
      let i = 1;

      while (ns.weakenAnalyze(i) < growSecurityIncrease) {
        i++;
      }

      return i;
    })();
    const weakenThreadsForCatchup = (() => {
      let i = 1;

      while (ns.weakenAnalyze(i) < securityToReduce) {
        i++;
      }

      return i;
    })();

    const growPortNumber = Date.now();
    const weakenPortNumber = Date.now() + 1;

    try {
      threadCoordinator.addGrowThreads(target, growThreads, 0, growPortNumber);
      threadCoordinator.addWeakenThreads(target, weakenThreadsForGrow + weakenThreadsForCatchup, 0, weakenPortNumber);
    } catch (e) {
      if (!(e instanceof NotEnoughRamError)) {
        throw e;
      }
    }

    await Promise.all([
      (async () => {
        while (ns.peek(growPortNumber) !== 'grow') {
          await ns.asleep(100);
        }
      })(),
      (async () => {
        while (ns.peek(weakenPortNumber) !== 'weaken') {
          await ns.asleep(100);
        }
      })(),
    ]);
  };

  while (ns.getServerSecurityLevel(target) > minSecurity || ns.getServerMoneyAvailable(target) < maxMoney) {
    await runPrep();
  }
}
