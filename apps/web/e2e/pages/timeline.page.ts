import type { Locator, Page } from "@playwright/test";
import { env } from "../fixtures/env";

const DRAG_STEPS = 20;

export class TimelinePage {
  constructor(private readonly page: Page) {}

  /**
   * ワークスペース > プロジェクト > Issues(Gantt レイアウト)へ遷移。
   * Issue layout の Gantt 切り替えはユーザー preference として API に保持されているので、
   * 画面遷移だけで Gantt が表示される想定(手動セットアップで事前設定済み、spec §4.6)。
   */
  async gotoIssueGantt(): Promise<void> {
    await this.page.goto(`/${env.workspaceSlug}/projects/${env.projectId}/issues/`);
    // Gantt コンテナの可視化を待機
    await this.page.locator("#gantt-container").waitFor({ state: "visible", timeout: 15_000 });
  }

  /** 指定 issue のブロックが DOM に登場するまで待機。 */
  async waitForBlock(issueId: string): Promise<void> {
    await this.page.locator(`[data-block-id="${issueId}"]`).waitFor({ state: "visible", timeout: 10_000 });
  }

  block(issueId: string): Locator {
    return this.page.locator(`[data-block-id="${issueId}"]`);
  }

  /**
   * source の右ハンドル → target の左端中央へドラッグ(期待: relation_type=blocking)。
   *
   * shiftKey=true のとき: mouse.up の直前に Shift を押し、picker を開いたまま離す。
   * 呼び出し側で picker 操作(relates_to クリック等)を継続する。
   */
  async dragRightTo(sourceIssueId: string, targetIssueId: string, options: { shiftKey?: boolean } = {}): Promise<void> {
    await this.startDragFromEdge(sourceIssueId, "right");
    await this.dropOnEdge(targetIssueId, "left", options);
  }

  /**
   * source の左ハンドル → target の右端中央へドラッグ(期待: relation_type=blocked_by)。
   */
  async dragLeftTo(sourceIssueId: string, targetIssueId: string, options: { shiftKey?: boolean } = {}): Promise<void> {
    await this.startDragFromEdge(sourceIssueId, "left");
    await this.dropOnEdge(targetIssueId, "right", options);
  }

  private async startDragFromEdge(issueId: string, edge: "left" | "right"): Promise<void> {
    // ハンドルの aria-label で特定する。
    // right handle: "Drag to create dependency from this work item"
    // left  handle: "Drag to create dependency blocking this work item"
    const ariaLabel =
      edge === "right"
        ? "Drag to create dependency from this work item"
        : "Drag to create dependency blocking this work item";

    const blockEl = this.block(issueId);
    const handle = blockEl.locator(`[aria-label="${ariaLabel}"]`);

    // ハンドルは isBlockActive=false のとき pointer-events:none / opacity:0。
    // locator.dispatchEvent はポインターイベント制限をバイパスして直接 onMouseDown を発火できる。
    // これにより store.beginDependencyDrag が呼ばれ、document の mousemove/mouseup リスナが登録される。
    //
    // clientX/Y: ハンドルの中央座標を渡す(store の initialPoint に使われる)。
    const handleBox = await handle.evaluate((el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });

    await handle.dispatchEvent("mousedown", {
      button: 0,
      buttons: 1,
      clientX: handleBox.x,
      clientY: handleBox.y,
      bubbles: true,
      cancelable: true,
    });

    // dispatchEvent 後にポインタを handle の中央に移動し、
    // document の mousemove リスナが dragPoint を更新できるようにする。
    await this.page.mouse.move(handleBox.x, handleBox.y);
  }

  private async dropOnEdge(issueId: string, edge: "left" | "right", options: { shiftKey?: boolean }): Promise<void> {
    const block = this.block(issueId);
    const box = await block.boundingBox();
    if (!box) {
      throw new Error(`target block ${issueId} has no bounding box (off-screen or zero-sized)`);
    }

    // target の半分判定: left → rect の左 1/4、right → rect の右 1/4
    const x = edge === "left" ? box.x + box.width * 0.25 : box.x + box.width * 0.75;
    const y = box.y + box.height / 2;
    await this.page.mouse.move(x, y, { steps: DRAG_STEPS });

    if (options.shiftKey) {
      await this.page.keyboard.down("Shift");
    }
    await this.page.mouse.up();
    if (options.shiftKey) {
      await this.page.keyboard.up("Shift");
    }
  }

  /** relation-type picker(Shift+drop 後に出現)の locator。 */
  get picker(): Locator {
    return this.page.locator('[role="dialog"][aria-label="Pick dependency type"]');
  }

  async clickPickerOption(option: "blocking" | "blocked_by" | "relates_to" | "duplicate"): Promise<void> {
    // picker option button のラベルは翻訳キー `gantt_dependency.picker.<type>` 経由
    // (relation-type-picker.tsx 参照)。アクセシブル名 = 翻訳結果で click。
    // 注: 下の regex は英語 UI 前提。UI locale が非英語の場合は翻訳に合わせて更新が必要。
    const nameRegex: Record<string, RegExp> = {
      blocking: /blocking/i,
      blocked_by: /blocked by/i,
      relates_to: /relates to/i,
      duplicate: /duplicate/i,
    };
    await this.picker.getByRole("button", { name: nameRegex[option] }).click();
  }
}
