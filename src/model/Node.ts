// ViGraph UI model - Node class
// Copyright (c) Paul Clark 2018

// Proxy class representing a node in the graph
import { Connector } from './Connector';
import { Graph } from './Graph';
import { Property } from './Property'

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

  get name(): string
  {
    return this.graph.getNodeProp(this.id, "name");
  }

  set name(name: string)
  {
    this.graph.setNodeProp(this.id, "name", name);
  }

  get displayName(): string
  {
    return this.graph.getNodeProp(this.id, "displayName");
  }

  set displayName(displayName: string)
  {
    this.graph.setNodeProp(this.id, "displayName", displayName);
  }

  get path(): string
  {
    return this.graph.getNodeProp(this.id, "path");
  }

  set path(path: string)
  {
    this.graph.setNodeProp(this.id, "path", path);
  }

  get dynamic(): boolean
  {
    return this.graph.getNodeProp(this.id, "dynamic");
  }

  set dynamic(dynamic: boolean)
  {
    this.graph.setNodeProp(this.id, "dynamic", dynamic);
  }

  get category(): string | null
  {
    return this.graph.getNodeProp(this.id, "category");
  }

  set category(category: string | null)
  {
    this.graph.setNodeProp(this.id, "category", category);
  }

  get description(): string
  {
    return this.graph.getNodeProp(this.id, "description");
  }

  set description(description: string)
  {
    this.graph.setNodeProp(this.id, "description", description);
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

  get subGraph(): boolean
  {
    return this.graph.getNodeProp(this.id, "subGraph");
  }

  set subGraph(subGraph: boolean)
  {
    this.graph.setNodeProp(this.id, "subGraph", subGraph);
  }

  public addEdge(output: string, dest: Node, destInput: string)
  {
    this.graph.addEdge(this.id, output, dest.id, destInput);
  }

  public getForwardEdges(): Array<{outputId: string, dest: Node,
    destInput: string }>
  {
    const result = new Array<{outputId: string, dest: Node,
      destInput: string }>();

    // Insert a Node proxy for 'dest'
    const edges = this.graph.getNodeForwardEdges(this.id);
    if (edges)
    {
      edges.forEach(
        (toArray?: [{ destId: string, destInput: string }], output?: string) =>
        {
          toArray!.forEach(
            (to: {destId: string, destInput: string}, index: number) =>
            {
              result.push({outputId: output!, dest: new Node(to.destId,
                this.graph), destInput: to.destInput})
            });
        });
    }
    return result;
  }

  public getReverseEdges(): Array<{inputId: string, src: Node,
    srcOutput: string }>
  {
    const result = new Array<{ inputId: string, src: Node,
      srcOutput: string }>();

    // Insert a Node proxy for 'src'
    const edges = this.graph.getNodeReverseEdges(this.id);
    if (edges)
    {
      edges.forEach(
        (fromArray?: [{ srcId: string, srcOutput: string }], input?: string) =>
        {
          fromArray!.forEach(
            (from: {srcId: string, srcOutput: string}, index: number) =>
            {
              result.push({inputId: input!, src: new Node(from.srcId,
                this.graph), srcOutput: from.srcOutput});
            });
        });
    }
    return result;
  }

  public getInputConnector(inputId: string): Connector | null
  {
    return this.graph.getNodeConnector(inputId, this.id, "input");
  }

  public getOutputConnector(outputId: string): Connector | null
  {
    return this.graph.getNodeConnector(outputId, this.id, "output");
  }

  // Number of edges connected to the given connector
  public edgesFromConnector(connector: Connector): Array<{dest: string,
    destInput: string}>
  {
    const result: Array<{dest: string, destInput: string}> = [];

    if (connector.direction === "input")
    {
      const reverse = this.getReverseEdges();

      reverse.forEach(
        (edge: {inputId: string, src: Node, srcOutput: string }, index) =>
        {
          if (edge.inputId === connector.id)
          {
            result.push({dest: edge.src.id, destInput: edge.srcOutput});
          }
        });
    }
    else
    {
      const forward = this.getForwardEdges();

      forward.forEach(
        (edge: {outputId: string, dest: Node, destInput: string}, index) =>
        {
          if (edge.outputId === connector.id)
          {
            result.push({dest: edge.dest.id, destInput: edge.destInput});
          }
        });
    }

    return result;
  }

  // Get connector position based on size of node and index of connector, if
  // connector doesn't have a given position already
  public getConnectorPosition(connector: Connector): {x: number, y: number}
  {
    let x = (connector.direction === "input" ? 0 : this.size.w);
    let y = 0;

    const allConnectors = this.graph.getNodeConnectors(this.id,
      connector.direction);

    if (connector.position)
    {
      return connector.position;
    }
    else
    {
      const nonPositionedConnectors: Array<Connector> = [];

      allConnectors.forEach((value: Connector) =>
      {
        if (!value.position)
        {
          nonPositionedConnectors.push(value);
        }
      });

      if (nonPositionedConnectors.length)
      {
        y = (this.size.h / (nonPositionedConnectors.length + 1)) *
          (nonPositionedConnectors.findIndex(x => x.id === connector.id) + 1);
      }
    }

    return ({x,y});
  }

  // Return array of properties for this node
  public getProperties(): Property[]
  {
    return this.graph.getProperties(this.id);
  }
}
