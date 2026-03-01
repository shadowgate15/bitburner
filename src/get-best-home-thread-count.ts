import { NS } from '@ns';

export async function main(ns: NS) {
  ns.tprint(getThreadCount(ns, 'home'));
}

let SCRIPT_RAM: number | null = null;
function getThreadCount(ns: NS, server: string): number {
  if (!SCRIPT_RAM) {
    SCRIPT_RAM = ns.getScriptRam('hack.js');
    ns.tprint(`hack.js requires ${ns.formatRam(SCRIPT_RAM)} of RAM`);
  }

  const maxRam = ns.getServerMaxRam(server);

  return Math.floor(maxRam / SCRIPT_RAM);
}
