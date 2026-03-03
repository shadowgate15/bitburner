export interface NormalizedFlags {
  /** Should the script run on the home server? */
  home: boolean;
}

export function normalizeFlags(ns: NS): NormalizedFlags {
  const flags = ns.flags([['home', false]]);

  return flags as unknown as NormalizedFlags;
}
