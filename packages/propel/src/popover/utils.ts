import { Placement } from "./types";

// Types for the new side and align values
type NewSide = "top" | "bottom" | "left" | "right";
type NewAlign = "start" | "center" | "end";

// Helper function to convert old placement to new side and align
export function convertPlacementToSideAndAlign(placement: Placement): {
  side: NewSide;
  align: NewAlign;
} {
  // Handle auto placements
  if (placement === "auto") {
    return { side: "bottom", align: "center" };
  }
  if (placement === "auto-start") {
    return { side: "bottom", align: "start" };
  }
  if (placement === "auto-end") {
    return { side: "bottom", align: "end" };
  }

  // Handle placements with alignment
  if (placement.includes("-")) {
    const [side, align] = placement.split("-") as [NewSide, "start" | "end"];
    return { side, align };
  }

  // Handle simple placements (default to center alignment)
  return { side: placement as NewSide, align: "center" };
}
