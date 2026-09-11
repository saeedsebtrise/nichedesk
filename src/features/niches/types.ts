export type Niche = {
  id: string;
  name: string;
  /** `null` for a top-level niche; otherwise the parent niche's id. */
  parentId: string | null;
  createdAt: string;
};

/** A niche placed in the tree, with its children and how deep it sits. */
export type NicheNode = Niche & {
  children: NicheNode[];
  depth: number;
};
