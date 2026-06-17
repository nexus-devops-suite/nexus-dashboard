import Reconciler from 'react-reconciler';
import { DefaultEventPriority } from 'react-reconciler/constants';
import { SceneNode } from './scene-graph';

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

  resetAfterCommit() {
    // No-op
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
