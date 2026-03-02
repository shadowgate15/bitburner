import { NS } from '@ns';
import { prep } from './prep';
import { runBatch } from './run-batch';

export async function main(ns: NS) {
  ns.disableLog('ALL');

  const target = ns.args[0];

  if (!target || typeof target !== 'string') {
    throw new Error('Please provide a target server as an argument');
  }

  await prep(ns, target);

  ns.tprint(`minSecurity: ${ns.getServerMinSecurityLevel(target)}`);
  ns.tprint(`currentSecurity: ${ns.getServerSecurityLevel(target)}`);
  ns.tprint(`maxMoney: ${ns.getServerMaxMoney(target)}`);
  ns.tprint(`currentMoney: ${ns.getServerMoneyAvailable(target)}`);
  ns.tprint(`Preparation completed for ${target}. Starting batch execution...`);
  ns.print(`Preparation completed for ${target}. Starting batch execution...`);

  while (true) {
    await runBatch(ns, target);

    ns.print(`Batch completed for ${target}. Restarting...`);
  }
}
