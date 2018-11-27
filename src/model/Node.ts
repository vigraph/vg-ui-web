// ViGraph UI model - Node class
// Copyright (c) Paul Clark 2018

// Proxy class representing a node in the graph
import { Graph } from './Graph';

export class Node
{
  public readonly id: string;
  private graph: Graph;

  constructor(id: string, graph: Graph)
  {
    this.id = id;
    this.graph = graph;
  }

  get type(): string
  {
    return this.graph.getNodeProp(this.id, "type");
  }

  get position(): { x: number, y: number }
  {
    return this.graph.getNodeProp(this.id, "position");
  }

  set position(pos: { x: number, y: number })
  {
    this.graph.setNodeProp(this.id, "position", pos);
  }

  get size(): { w: number, h: number }
  {
    return this.graph.getNodeProp(this.id, "size");
  }

  set size(size: { w: number, h: number })
  {
    this.graph.setNodeProp(this.id, "size", size);
  }

  public addEdge(output: string, dest: Node, destInput: string)
  {
    this.graph.addEdge(this.id, output, dest.id, destInput);
  }

  public getForwardEdges(): Map<string, { dest: Node, destInput: string }>
  {
    const result = new Map<string, { dest: Node, destInput: string }>();
    // Insert a Node proxy for 'dest'
    const edges = this.graph.getNodeForwardEdges(this.id);
    if (edges)
    {
      edges.forEach(
        (to: { destId: string, destInput: string }, output: string) =>
        {
          result.set(output, {
            "dest": new Node(to.destId, this.graph),
            "destInput": to.destInput
          });
        });
    }
    return result;
  }

  public getReverseEdges(): Map<string, { src: Node, srcOutput: string }>
  {
    const result = new Map<string, { src: Node, srcOutput: string }>();
    // Insert a Node proxy for 'src'
    const edges = this.graph.getNodeReverseEdges(this.id);
    if (edges)
    {
      edges.forEach(
        (from: { srcId: string, srcOutput: string }, input: string) =>
        {
          result.set(input, {
            "src": new Node(from.srcId, this.graph),
            "srcOutput": from.srcOutput
          });
        });
    }
    return result;
  }
}
