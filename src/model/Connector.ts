// ViGraph UI model - Connection class
// Copyright (c) Paul Clark 2019

// Proxy class representing a connection in the graph
import { Graph } from './Graph';

export class Connector
{
  public readonly id: string;
  public readonly parent: string;
  public readonly type: string;
  private graph: Graph;

  constructor(id: string, parent: string, type: string, graph: Graph)
  {
    this.id = id;
    this.parent = parent;
    this.type = type;
    this.graph = graph;
  }

  get connectorType(): string
  {
    return this.graph.getNodeConnectorProp(this.id, this.parent, this.type,
      "connectorType");
  }

  get position(): { x: number, y: number }
  {
    return this.graph.getNodeConnectorProp(this.id, this.parent, this.type,
      "position");
  }

  set position(pos: { x: number, y: number })
  {
    this.graph.setNodeConnectorProp(this.id, this.parent, this.type,
      "position", pos);
  }

  get maxConnections(): number
  {
    return this.graph.getNodeConnectorProp(this.id, this.parent, this.type,
      "maxConnections");
  }

  set maxConnections(maxConnections: number)
  {
    this.graph.setNodeConnectorProp(this.id, this.parent, this.type,
      "maxConnections", maxConnections);
  }
}
