import { nuke } from './deploy/nuke';
import { ServerList } from './deploy/server-list';

export async function main(ns: NS) {
  ServerList.getAll(ns)
    .filter((server) => !ns.hasRootAccess(server))
    .filter((server) => ns.getHackingLevel() > ns.getServerRequiredHackingLevel(server))
    .map((server) => {
      ns.tprint(server);
      nuke(ns, server);
    });
}
