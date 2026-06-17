import { SceneNode } from './scene-graph';

export class InputMapper {
  private root: SceneNode;
  private canvas: HTMLCanvasElement;
  private hoveredNode: SceneNode | null = null;

  constructor(canvas: HTMLCanvasElement, root: SceneNode) {
    this.canvas = canvas;
    this.root = root;
    this.setupListeners();
  }

  private setupListeners(): void {
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
  }

  private getRelativeCoords(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private hitTest(node: SceneNode, x: number, y: number): SceneNode | null {
    const pos = node.getAbsolutePosition();
    const isInside =
      x >= pos.x &&
      x <= pos.x + node.width &&
      y >= pos.y &&
      y <= pos.y + node.height;

    if (!isInside) return null;

    // Check children in reverse order (top-most elements first)
    for (let i = node.children.length - 1; i >= 0; i--) {
      const hit = this.hitTest(node.children[i], x, y);
      if (hit) return hit;
    }

    return node;
  }

  private handleClick(e: MouseEvent): void {
    const { x, y } = this.getRelativeCoords(e);
    const target = this.hitTest(this.root, x, y);
    if (target && target.props.onClick) {
      target.props.onClick({
        type: 'click',
        target,
        clientX: e.clientX,
        clientY: e.clientY,
      });
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    const { x, y } = this.getRelativeCoords(e);
    const target = this.hitTest(this.root, x, y);

    if (target !== this.hoveredNode) {
      if (this.hoveredNode && this.hoveredNode.props.onMouseLeave) {
        this.hoveredNode.props.onMouseLeave({ type: 'mouseleave', target: this.hoveredNode });
      }

      if (target && target.props.onMouseEnter) {
        target.props.onMouseEnter({ type: 'mouseenter', target });
      }

      this.hoveredNode = target;
    }
  }
}
