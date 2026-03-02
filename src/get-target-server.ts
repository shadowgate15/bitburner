import { NS } from '@ns';
import { getTargetServer } from './deploy/get-target-server';
import { ServerList } from './deploy/server-list';

export async function main(ns: NS) {
  const servers = ServerList.get(ns);

  ns.tprint(getTargetServer(ns, servers));
}
