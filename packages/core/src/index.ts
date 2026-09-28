/** Shared dock layout constants — mirrors macos ContextCore DockMetrics. */

export const DOCK_PANEL_WIDTH = 66;
export const DOCK_CELL_HEIGHT = 54;
export const DOCK_ICON_SIZE = 44;
export const DOCK_APP_ICON_SIZE = 50;
export const DOCK_PADDING_Y = 7;
export const DOCK_CORNER_RADIUS = 22;
export const DOCK_HOVER_SCALE = 1.06;
export const DOCK_MAX_ITEMS = 12;
export const CLIPBOARD_HISTORY_CAP = 200;
export const CLIPBOARD_IMAGE_CAP = 12;

export type DockEdge = "left" | "right";

export type DockItemKind =
  | "app"
  | "link"
  | "divider"
  | "clipboard"
  | "weather"
  | "player"
  | "bluetooth"
  | "keyboard"
  | "stats"
  | "usage"
  | "activity";

export interface DockItem {
  id: string;
  kind: DockItemKind;
  name?: string;
  running?: boolean;
}

export function panelHeight(itemCount: number, dividerCount: number): number {
  const cells = itemCount - dividerCount;
  const cellStack = cells * DOCK_CELL_HEIGHT;
  const dividers = dividerCount * 15; // 1pt line + 7pt margins each side
  return DOCK_PADDING_Y * 2 + cellStack + dividers;
}

export function isWithinItemBudget(items: DockItem[]): boolean {
  const countable = items.filter((i) => i.kind !== "divider");
  return countable.length <= DOCK_MAX_ITEMS;
}
