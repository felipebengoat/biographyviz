declare module 'vis-network' {
  export interface NetworkOptions {
    nodes?: any;
    edges?: any;
    physics?: any;
    interaction?: any;
    layout?: any;
    groups?: any;
    configure?: any;
  }

  export interface NetworkData {
    nodes: any[];
    edges: any[];
  }

  export class Network {
    constructor(container: HTMLElement, data: NetworkData, options?: NetworkOptions);
    on(event: string, callback: (params?: any) => void): void;
    off(event: string, callback: (params?: any) => void): void;
    setData(data: NetworkData): void;
    setOptions(options: NetworkOptions): void;
    destroy(): void;
    fit(): void;
    focus(nodeId: string | number, options?: any): void;
    moveTo(options: any): void;
    getPositions(nodeIds?: string[] | number[]): any;
    getBoundingBox(nodeId: string | number): any;
    getConnectedNodes(nodeId: string | number, direction?: string): any[];
    getConnectedEdges(nodeId: string | number): any[];
    getSelection(): { nodes: any[]; edges: any[] };
    getSelectedNodes(): any[];
    getSelectedEdges(): any[];
    selectNodes(nodeIds: string[] | number[], highlightEdges?: boolean): void;
    selectEdges(edgeIds: string[] | number[]): void;
    setSelection(selection: { nodes?: string[] | number[]; edges?: string[] | number[] }, options?: any): void;
    unselectAll(): void;
  }

  export default Network;
}

