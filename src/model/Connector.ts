// ViGraph UI model - Connection class
// Copyright (c) Paul Clark 2019

// Proxy class representing a connection in the graph
import { Graph } from './Graph';

export class Connector
{
  public readonly id: string;
  public readonly parent: string;
  public readonly direction: string;
  private graph: Graph;

  constructor(id: string, parent: string, direction: string, graph: Graph)
  {
    this.id = id;
    this.parent = parent;
    this.direction = direction;
    this.graph = graph;
  }

  get connectorType(): string
  {
    return this.graph.getNodeConnectorProp(this.id, this.parent, this.direction,
      "connectorType");
  }

  get multiple(): boolean
  {
    return this.graph.getNodeConnectorProp(this.id, this.parent, this.direction,
      "multiple");
  }

  set multiple(multiple: boolean)
  {
    this.graph.setNodeConnectorProp(this.id, this.parent, this.direction,
      "multiple", multiple);
  }

  get prop(): boolean
  {
    return this.graph.getNodeConnectorProp(this.id, this.parent, this.direction,
      "prop");
  }

  set prop(prop: boolean)
  {
    this.graph.setNodeConnectorProp(this.id, this.parent, this.direction,
      "prop", prop);
  }

  get position(): {x: number, y: number} | null
  {
    return this.graph.getNodeConnectorProp(this.id, this.parent, this.direction,
      "position");
  }

  set position(position: {x: number, y: number} | null)
  {
    this.graph.setNodeConnectorProp(this.id, this.parent, this.direction,
      "position", position);
  }
}
