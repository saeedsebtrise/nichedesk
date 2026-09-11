import type { ReactElement, SVGProps } from "react";

/**
 * Line icons drawn on a 24px grid, stroked in currentColor so they take the
 * text colour of wherever they sit. Inline SVG rather than an icon font: no
 * extra request, and every icon is decorative (aria-hidden) by default.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const ArrowRight = (props: IconProps) => (
  <Svg {...props}>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </Svg>
);

export const Check = (props: IconProps) => (
  <Svg {...props}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);

export const Cross = (props: IconProps) => (
  <Svg {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

const Tree = (props: IconProps) => (
  <Svg {...props}>
    <rect x="9" y="3" width="6" height="5" rx="1.2" />
    <rect x="3" y="16" width="6" height="5" rx="1.2" />
    <rect x="15" y="16" width="6" height="5" rx="1.2" />
    <path d="M12 8v4M6 16v-4h12v4" />
  </Svg>
);

const Upload = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 15V3M7 8l5-5 5 5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </Svg>
);

const Filter = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3 5h18l-7 8v6l-4 2v-8z" />
  </Svg>
);

const Gauge = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3.5 17a9 9 0 1 1 17 0" />
    <path d="m12 14 4-5" />
    <circle cx="12" cy="14" r="1.2" />
  </Svg>
);

const ListChecks = (props: IconProps) => (
  <Svg {...props}>
    <path d="m3 6 2 2 3-3M3 13l2 2 3-3M12 6h9M12 13h9M12 20h9M4 20h4" />
  </Svg>
);

const Layers = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 2 2 7l10 5 10-5z" />
    <path d="m2 12 10 5 10-5M2 17l10 5 10-5" />
  </Svg>
);

const Download = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 3v12M7 10l5 5 5-5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </Svg>
);

const Lock = (props: IconProps) => (
  <Svg {...props}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Svg>
);

const Search = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);

const Refresh = (props: IconProps) => (
  <Svg {...props}>
    <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4" />
  </Svg>
);

export type IconName =
  | "tree"
  | "upload"
  | "filter"
  | "gauge"
  | "list"
  | "layers"
  | "download"
  | "lock"
  | "search"
  | "refresh";

export const ICONS: Record<IconName, (props: IconProps) => ReactElement> = {
  tree: Tree,
  upload: Upload,
  filter: Filter,
  gauge: Gauge,
  list: ListChecks,
  layers: Layers,
  download: Download,
  lock: Lock,
  search: Search,
  refresh: Refresh,
};
