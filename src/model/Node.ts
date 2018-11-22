// ViGraph UI model - Node class
// Copyright (c) Paul Clark 2018

// Proxy class representing a node in the graph
import { Graph } from './Graph';

export class Node
{
  public id: string;
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
    this.graph.setNodePosition(this.id, pos);
  }
}
