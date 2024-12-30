import { Node } from "@tiptap/pm/model";
import { Selection, SelectionRange } from "@tiptap/pm/state";
import { Mappable } from "@tiptap/pm/transform";

export class MultiRangeSelection extends Selection {
  ranges: SelectionRange[];

  constructor(ranges: SelectionRange[]) {
    // ProseMirror's `Selection` requires a "from" and a "to",
    // but in a multi-range scenario, we use the first and last positions.
    super(ranges[0].$from, ranges[ranges.length - 1].$to, ranges);
    this.ranges = ranges;
  }

  map(doc: Node, mapping: Mappable): Selection {
    // You would typically map positions here if positions can change,
    // but for simplicity we return the same set of ranges.
    // For safer usage, you would re-map each range’s start and end.
    return new MultiRangeSelection(this.ranges);
  }

  eq(other: Selection): boolean {
    if (!(other instanceof MultiRangeSelection)) return false;
    if (this.ranges.length !== other.ranges.length) return false;

    for (let i = 0; i < this.ranges.length; i++) {
      if (
        this.ranges[i].$from.pos !== other.ranges[i].$from.pos ||
        this.ranges[i].$to.pos !== other.ranges[i].$to.pos
      ) {
        return false;
      }
    }
    return true;
  }

  toJSON(): any {
    return {
      type: "multiRangeSelection",
      ranges: this.ranges.map((range) => ({
        from: range.$from.pos,
        to: range.$to.pos,
      })),
    };
  }

  static create(ranges: SelectionRange[]) {
    return new MultiRangeSelection(ranges);
  }

  static fromJSON(doc: Node, json: any) {
    const ranges = json.ranges.map((r: any) => new SelectionRange(doc.resolve(r.from), doc.resolve(r.to)));
    return this.create(ranges);
  }
}
