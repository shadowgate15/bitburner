import { NS } from '@ns';
import { getTargetServer } from './deploy/get-target-server';
import { ServerList } from './deploy/server-list';

export async function main(ns: NS) {
  const { home } = ns.flags([['home', false]]);

  const servers = ServerList.get(ns);

  const args = ['--target', getTargetServer(ns, servers)];

  if (home) {
    args.push('--home');
  }

  ns.spawn('controller/index.js', { threads: 1, spawnDelay: 500 }, ...args);
}
