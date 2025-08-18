import { HTMLElement } from "node-html-parser";
import { IParserExtension } from "@plane/etl/parser";

enum EConfluenceNoteType {
  NOTE = "note",
  WARNING = "warning",
  INFO = "information",
  TIP = "tip",
}

enum EConfluenceCalloutType {
  COLLAPSIBLE = "collapsible",
  DECISION_LIST = "decision-list",
  PANEL = "panel",
  NOTE_MACRO = "note-macro",
  UNKNOWN = "unknown",
}

interface CalloutConfig {
  icon: string;
  color: string;
  background?: string;
}

export class ConfluenceCalloutParserExtension implements IParserExtension {
  shouldParse(node: HTMLElement): boolean {
    return !!(
      // Collapsible containers
      (
        (node.tagName === "DIV" && node.getAttribute("class")?.includes("expand-container")) ||
        // Decision lists
        (node.tagName === "UL" && node.getAttribute("class")?.includes("decision-list")) ||
        // Panels (excluding code panels)
        (node.tagName === "DIV" &&
          node.getAttribute("class")?.includes("panel") &&
          !node.getAttribute("class")?.includes("code")) ||
        // Information macros
        (node.tagName === "DIV" && node.getAttribute("class")?.includes("confluence-information-macro"))
      )
    );
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    const calloutType = this.detectCalloutType(node);

    switch (calloutType) {
      case EConfluenceCalloutType.COLLAPSIBLE:
        return this.handleCollapsible(node);
      case EConfluenceCalloutType.DECISION_LIST:
        return this.handleDecisionList(node);
      case EConfluenceCalloutType.PANEL:
        return this.handlePanel(node);
      case EConfluenceCalloutType.NOTE_MACRO:
        return this.handleNoteMacro(node);
      default:
        return node;
    }
  }

  private detectCalloutType(node: HTMLElement): EConfluenceCalloutType {
    if (node.tagName === "DIV" && node.getAttribute("class")?.includes("expand-container")) {
      return EConfluenceCalloutType.COLLAPSIBLE;
    }
    if (node.tagName === "UL" && node.getAttribute("class")?.includes("decision-list")) {
      return EConfluenceCalloutType.DECISION_LIST;
    }
    if (
      node.tagName === "DIV" &&
      node.getAttribute("class")?.includes("panel") &&
      !node.getAttribute("class")?.includes("code")
    ) {
      return EConfluenceCalloutType.PANEL;
    }
    if (node.tagName === "DIV" && node.getAttribute("class")?.includes("confluence-information-macro")) {
      return EConfluenceCalloutType.NOTE_MACRO;
    }
    return EConfluenceCalloutType.UNKNOWN;
  }

  private handleCollapsible(node: HTMLElement): HTMLElement {
    const content = node.querySelector(".expand-content");
    if (!content) return node;

    const config: CalloutConfig = {
      icon: "ChevronDown",
      color: "#6d7b8a",
    };

    return this.createPlaneCallout(content, config);
  }

  private handleDecisionList(node: HTMLElement): HTMLElement {
    const decisionList = node.querySelector("li");
    if (!decisionList) return node;

    const config: CalloutConfig = {
      icon: "CornerUpRight",
      color: "#6d7b8a",
    };

    return this.createPlaneCallout(decisionList, config);
  }

  private handlePanel(node: HTMLElement): HTMLElement {
    const panel = node.querySelector(".panelContent");
    if (!panel) return node;

    const config: CalloutConfig = {
      icon: "Info",
      color: "#6d7b8a",
      background: "purple",
    };

    return this.createPlaneCallout(panel, config);
  }

  private handleNoteMacro(node: HTMLElement): HTMLElement {
    const getType = () => {
      const classList = node.getAttribute("class")?.split(" ");
      const type = classList?.find((className) => className.startsWith("confluence-information-macro-"));
      if (!type) return "Info";
      return type.split("-").pop() || "Info";
    };

    const type = getType();
    const note = node.querySelector(".confluence-information-macro-body");
    if (!note) return node;

    const config = this.getIconAndColorForNote(type as EConfluenceNoteType);
    return this.createPlaneCallout(note, config);
  }

  private createPlaneCallout(node: HTMLElement, config: CalloutConfig): HTMLElement {
    const callout = new HTMLElement("div", {}, "");
    callout.setAttribute("data-icon-color", config.color);
    callout.setAttribute("data-icon-name", config.icon);
    callout.setAttribute("data-logo-in-use", "icon");
    callout.setAttribute("data-block-type", "callout-component");

    if (config.background) {
      callout.setAttribute("data-background", config.background);
    }

    callout.innerHTML = node.innerHTML;
    return callout;
  }

  private getIconAndColorForNote(type: EConfluenceNoteType): CalloutConfig {
    switch (type) {
      case EConfluenceNoteType.NOTE:
        return { icon: "Book", color: "#6d7b8a", background: "gray" };
      case EConfluenceNoteType.WARNING:
        return { icon: "AlertCircle", color: "#6d7b8a", background: "peach" };
      case EConfluenceNoteType.INFO:
        return { icon: "Info", color: "#6d7b8a", background: "purple" };
      case EConfluenceNoteType.TIP:
        return { icon: "ArrowRight", color: "#6d7b8a", background: "green" };
      default:
        return { icon: "Info", color: "#6d7b8a", background: "light-blue" };
    }
  }
}
