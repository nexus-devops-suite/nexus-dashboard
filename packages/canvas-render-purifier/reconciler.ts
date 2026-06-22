import Reconciler from 'react-reconciler';
import { DefaultEventPriority } from 'react-reconciler/constants';
import { SceneNode } from './scene-graph';

let wasmEngine: any = null;
try {
  const { LayoutEngine } = require('./pkg/crp_layout_engine.js');
  wasmEngine = new LayoutEngine();
} catch (e) {
  // Graceful fallback
}

function buildLayoutInput(node: SceneNode): any {
  return {
    id: node.id,
    flex_direction: node.props.style?.flexDirection || 'column',
    justify_content: node.props.style?.justifyContent || 'flex-start',
    align_items: node.props.style?.alignItems || 'flex-start',
    width: typeof node.props.style?.width === 'number' ? node.props.style.width : undefined,
    height: typeof node.props.style?.height === 'number' ? node.props.style.height : undefined,
    padding: node.props.style?.padding || 0,
    margin: node.props.style?.margin || 0,
    children: node.children.map(buildLayoutInput),
  };
}

function applyLayoutResult(node: SceneNode, result: any) {
  if (!result || node.id !== result.id) return;
  node.x = result.x || 0;
  node.y = result.y || 0;
  node.width = result.width || 0;
  node.height = result.height || 0;
  
  for (let i = 0; i < node.children.length; i++) {
    if (result.children && result.children[i]) {
      applyLayoutResult(node.children[i], result.children[i]);
    }
  }
}

function computeFallbackLayout(node: SceneNode, parentWidth: number = 1024, parentHeight: number = 768) {
  const style = node.props.style;
  const width = typeof style?.width === 'number' ? style.width : parentWidth;
  const height = typeof style?.height === 'number' ? style.height : parentHeight;
  
  node.width = width;
  node.height = height;

  let currentY = style?.padding || 0;
  let currentX = style?.padding || 0;

  for (const child of node.children) {
    if (style?.flexDirection === 'row') {
      computeFallbackLayout(child, width, height);
      child.x = currentX;
      child.y = style?.padding || 0;
      currentX += child.width + (style?.margin || 0);
    } else {
      computeFallbackLayout(child, width, height);
      child.x = style?.padding || 0;
      child.y = currentY;
      currentY += child.height + (style?.margin || 0);
    }
  }
}

export function computeLayout(root: SceneNode) {
  if (wasmEngine && typeof wasmEngine.compute_layout === 'function') {
    try {
      const input = buildLayoutInput(root);
      const output = wasmEngine.compute_layout(input);
      applyLayoutResult(root, output);
      return;
    } catch (e) {
      console.warn("WASM layout calculation failed, falling back to pure TS layout", e);
    }
  }
  computeFallbackLayout(root, root.width || 1024, root.height || 768);
}

const hostConfig: Reconciler.HostConfig<
  string,       // Type
  any,          // Props
  SceneNode,    // Container
  SceneNode,    // Instance
  SceneNode,    // TextInstance
  any,          // SuspenseInstance
  any,          // HydratableInstance
  any,          // PublicInstance
  any,          // HostContext
  any,          // UpdatePayload
  any,          // ChildSet
  any,          // TimeoutHandle
  any           // NoTimeout
> = {
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,

  createInstance(type, props) {
    const id = `${type}_${Math.random().toString(36).substr(2, 9)}`;
    return new SceneNode(id, type, props);
  },

  createTextInstance(text) {
    const id = `text_${Math.random().toString(36).substr(2, 9)}`;
    return new SceneNode(id, 'text', { text });
  },

  appendInitialChild(parentInstance, child) {
    parentInstance.appendChild(child);
  },

  finalizeInitialChildren() {
    return false;
  },

  prepareUpdate() {
    return true; // Simple approach: always mark as needing update
  },

  shouldSetTextContent() {
    return false;
  },

  getRootHostContext() {
    return null;
  },

  getChildHostContext(parentHostContext) {
    return parentHostContext;
  },

  getPublicInstance(instance) {
    return instance;
  },

  prepareForCommit() {
    return null;
  },

  resetAfterCommit(containerInfo) {
    if (containerInfo instanceof SceneNode) {
      computeLayout(containerInfo);
    }
  },

  appendChild(parentInstance, child) {
    parentInstance.appendChild(child);
  },

  appendChildToContainer(container, child) {
    container.appendChild(child);
  },

  insertBefore(parentInstance, child, beforeChild) {
    parentInstance.insertBefore(child, beforeChild);
  },

  insertInContainerBefore(container, child, beforeChild) {
    container.insertBefore(child, beforeChild);
  },

  removeChild(parentInstance, child) {
    parentInstance.removeChild(child);
  },

  removeChildFromContainer(container, child) {
    container.removeChild(child);
  },

  commitUpdate(instance, updatePayload, type, oldProps, newProps) {
    instance.updateProps(newProps);
  },

  commitTextUpdate(textInstance, oldText, newText) {
    textInstance.updateProps({ text: newText });
  },

  clearContainer(container) {
    container.children = [];
    container.markDirty();
  },

  scheduleTimeout(fn, delay) {
    return setTimeout(fn, delay);
  },

  cancelTimeout(id) {
    clearTimeout(id);
  },

  noTimeout: -1,
  
  getCurrentEventPriority() {
    return DefaultEventPriority;
  },
  
  getInstanceFromNode(node) {
    return null;
  },
  
  beforeActiveInstanceBlur() {},
  afterActiveInstanceBlur() {},
  preparePortalMount() {},
  detachDeletedInstance() {}
};

const CanvasReconciler = Reconciler(hostConfig);

export const CanvasRenderer = {
  render(element: any, containerNode: SceneNode, callback?: () => void) {
    const container = containerNode as any;
    if (!container._reactRoot) {
      container._reactRoot = CanvasReconciler.createContainer(
        containerNode,
        0, // ConcurrentRoot
        null,
        false,
        null,
        "",
        () => {},
        null
      );
    }
    CanvasReconciler.updateContainer(element, container._reactRoot, null, callback);
  }
};
