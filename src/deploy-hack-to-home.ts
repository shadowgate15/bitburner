import { NS } from '@ns';
import { getTargetServer } from './deploy/get-target-server';
import { ServerList } from './deploy/server-list';

export async function main(ns: NS) {
  const targetServer = getTargetServer(ns, ServerList.get(ns));

  const freeRam = ns.getServerMaxRam('home') - ns.getServerUsedRam('home');

  const scriptRam = ns.getScriptRam('hack.js');

  const threadCount = Math.floor(freeRam / scriptRam);

  ns.run('hack.js', threadCount, targetServer);
}
