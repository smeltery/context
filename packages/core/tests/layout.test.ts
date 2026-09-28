import { describe, expect, test } from "bun:test";
import {
  CLIPBOARD_HISTORY_CAP,
  DOCK_MAX_ITEMS,
  DOCK_PANEL_WIDTH,
  isWithinItemBudget,
  panelHeight,
  type DockItem,
} from "../src/index.ts";

describe("dock layout", () => {
  test("panel width matches marketing geometry", () => {
    expect(DOCK_PANEL_WIDTH).toBe(66);
  });

  test("panel height stacks cells and padding", () => {
    expect(panelHeight(3, 0)).toBe(7 * 2 + 3 * 54);
  });

  test("item budget ignores dividers", () => {
    const items: DockItem[] = [
      ...Array.from({ length: DOCK_MAX_ITEMS }, (_, i) => ({
        id: `a${i}`,
        kind: "app" as const,
      })),
      { id: "d1", kind: "divider" },
    ];
    expect(isWithinItemBudget(items)).toBe(true);
    items.push({ id: "extra", kind: "link" });
    expect(isWithinItemBudget(items)).toBe(false);
  });

  test("clipboard history cap", () => {
    expect(CLIPBOARD_HISTORY_CAP).toBe(200);
  });
});
