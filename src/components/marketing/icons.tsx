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

export const Plus = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const Close = (props: IconProps) => (
  <Svg {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

export const Menu = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const LayoutGrid = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </Svg>
);

export const Pencil = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" />
    <path d="m14.5 7.5 3 3" />
  </Svg>
);

export const Trash = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5" />
  </Svg>
);

export const ChevronRight = (props: IconProps) => (
  <Svg {...props}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);

export const Sliders = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </Svg>
);

export const Columns = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <path d="M9.5 4.5v15M14.5 4.5v15" />
  </Svg>
);

export const Flame = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 3c.5 3 4.5 5 4.5 10a4.5 4.5 0 0 1-9 0c0-2.5 1.3-4 2.5-5 0 2 .8 3 2 3 0-3-1-5.5 0-8Z" />
  </Svg>
);

export const ArrowUpRight = (props: IconProps) => (
  <Svg {...props}>
    <path d="M7 17 17 7M8 7h9v9" />
  </Svg>
);

export const Circle = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.5" />
  </Svg>
);

export const Calendar = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Svg>
);

export const Copies = (props: IconProps) => (
  <Svg {...props}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </Svg>
);

export const TrendUp = (props: IconProps) => (
  <Svg {...props}>
    <path d="m3 17 6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </Svg>
);

export const Inbox = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3 13h5l1.5 3h5L16 13h5" />
    <path d="M5.5 5h13l2.5 8v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Z" />
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
