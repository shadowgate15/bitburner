import { NS } from '@ns';
import { ThreadCoordinator } from './thread-coordinator';

const DELAY = 5;

export async function runBatch(ns: NS, target: string) {
  const threadCoordinator = new ThreadCoordinator(ns);
  const portNumber = Date.now();

  const maxMoney = ns.getServerMaxMoney(target);

  const growTime = ns.getGrowTime(target);
  const weakenTime = ns.getWeakenTime(target);
  const hackTime = ns.getHackTime(target);

  const hackMoney = maxMoney * 0.3;
  const hackThreads = Math.floor(ns.hackAnalyzeThreads(target, hackMoney));
  const hackDelay = weakenTime - hackTime - DELAY;
  const hackSecurityIncrease = ns.hackAnalyzeSecurity(hackThreads, target);

  const growMultiplier = hackMoney > 0 ? maxMoney / (maxMoney - hackMoney) : maxMoney;
  const growThreads = Math.ceil(ns.growthAnalyze(target, growMultiplier));
  const growDelay = weakenTime - growTime + DELAY;
  // Don't provide target because the target is fully grown,
  // so the security increase would be 0.
  const growSecurityIncrease = ns.growthAnalyzeSecurity(growThreads);

  const weakenHackThreads = (() => {
    let i = 1;

    while (ns.weakenAnalyze(i) < hackSecurityIncrease) {
      i++;
    }

    // Adding an extra thread to make sure we reduce the security level enough, since weakenAnalyze only gives an estimate
    return ++i;
  })();
  const weakenGrowThreads = (() => {
    let i = 1;

    while (ns.weakenAnalyze(i) < growSecurityIncrease) {
      i++;
    }

    // Adding an extra thread to make sure we reduce the security level enough, since weakenAnalyze only gives an estimate
    return ++i;
  })();

  threadCoordinator.addHackThreads(target, hackThreads, hackDelay);
  threadCoordinator.addWeakenThreads(target, weakenHackThreads);
  threadCoordinator.addGrowThreads(target, growThreads, growDelay);
  threadCoordinator.addWeakenThreads(target, weakenGrowThreads, DELAY * 2, portNumber);

  await ns.nextPortWrite(portNumber);
}
