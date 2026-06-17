export interface LayoutStyle {
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  width?: number | string;
  height?: number | string;
  padding?: number;
  margin?: number;
  borderRadius?: number;
}

export interface NodeProps {
  style?: LayoutStyle;
  color?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  onClick?: (event: any) => void;
  onMouseEnter?: (event: any) => void;
  onMouseLeave?: (event: any) => void;
  [key: string]: any;
}

export class SceneNode {
  public id: string;
  public type: string;
  public props: NodeProps;
  public children: SceneNode[] = [];
  public parent: SceneNode | null = null;

  // Calculated layout bounds (updated by CRP layout engine)
  public x: number = 0;
  public y: number = 0;
  public width: number = 0;
  public height: number = 0;

  // Dirty flags for efficient re-renders
  public isDirty: boolean = true;

  constructor(id: string, type: string, props: NodeProps = {}) {
    this.id = id;
    this.type = type;
    this.props = props;
  }

  public appendChild(child: SceneNode): void {
    child.parent = this;
    this.children.push(child);
    this.markDirty();
  }

  public removeChild(child: SceneNode): void {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      child.parent = null;
      this.children.splice(idx, 1);
      this.markDirty();
    }
  }

  public insertBefore(child: SceneNode, beforeChild: SceneNode): void {
    const idx = this.children.indexOf(beforeChild);
    child.parent = this;
    if (idx !== -1) {
      this.children.splice(idx, 0, child);
    } else {
      this.children.push(child);
    }
    this.markDirty();
  }

  public markDirty(): void {
    this.isDirty = true;
    if (this.parent) {
      this.parent.markDirty();
    }
  }

  public updateProps(newProps: NodeProps): void {
    this.props = { ...this.props, ...newProps };
    this.markDirty();
  }

  // Traverses absolute coordinates of the node relative to canvas root
  public getAbsolutePosition(): { x: number; y: number } {
    let absX = this.x;
    let absY = this.y;
    let current = this.parent;
    while (current) {
      absX += current.x;
      absY += current.y;
      current = current.parent;
    }
    return { x: absX, y: absY };
  }
}
