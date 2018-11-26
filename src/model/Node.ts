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

  addEdge(output: string, dest: Node, destInput: string)
  {
    this.graph.addEdge(this.id, output, dest.id, destInput);
  }

  getForwardEdges(): Map<string, { dest: Node, destInput: string }>
  {
    const result = new Map<string, { dest: Node, destInput: string }>();
    // Insert a Node proxy for 'dest'
    this.graph.getNodeForwardEdges(this.id).forEach(
      (to: { destId: string, destInput: string }, output: string) =>
      {
        result[output] = {
          "dest": new Node(to.destId, this.graph),
          "destInput": to.destInput
        };
      });
    return result;
  }

  getReverseEdges(): Map<string, { src: Node, srcOutput: string }>
  {
    const result = new Map<string, { src: Node, srcOutput: string }>();
    // Insert a Node proxy for 'src'
    this.graph.getNodeReverseEdges(this.id).forEach(
      (from: { srcId: string, srcOutput: string }, input: string) =>
      {
        result[input] = {
          "src": new Node(from.srcId, this.graph),
          "srcOutput": from.srcOutput
        };
      });
    return result;
  }
}
