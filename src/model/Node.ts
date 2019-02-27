// ViGraph UI model - Node class
// Copyright (c) Paul Clark 2018

// Proxy class representing a node in the graph
import { Connector } from './Connector';
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

  public getForwardEdges(): Array<{outputId: string, dest: Node, destInput: string }>
  {
    const result = new Array<{outputId: string, dest: Node, destInput: string }>();
    // Insert a Node proxy for 'dest'
    const edges = this.graph.getNodeForwardEdges(this.id);
    if (edges)
    {
      edges.forEach(
        (toArray: [{ destId: string, destInput: string }], output: string) =>
        {
          toArray.forEach(
            (to: {destId: string, destInput: string}, index: number) =>
            {
              result.push({outputId: output, dest: new Node(to.destId,
                this.graph), destInput: to.destInput})
            });
        });
    }
    return result;
  }

  public getReverseEdges(): Array<{inputId: string, src: Node, srcOutput: string }>
  {
    const result = new Array<{ inputId: string, src: Node, srcOutput: string }>();
    // Insert a Node proxy for 'src'
    const edges = this.graph.getNodeReverseEdges(this.id);
    if (edges)
    {
      edges.forEach(
        (fromArray: [{ srcId: string, srcOutput: string }], input: string) =>
        {
          fromArray.forEach(
            (from: {srcId: string, srcOutput: string}, index: number) =>
            {
              result.push({inputId: input, src: new Node(from.srcId,
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

  public edgesFromConnector(connector: Connector): number
  {
    let count = 0;

    if (connector.direction === "input")
    {
      const reverse = this.getReverseEdges();

      reverse.forEach(
        (edge: {inputId: string, src: Node, srcOutput: string }, index) =>
        {
          if (edge.inputId === connector.id)
          {
            count++;
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
            count++;
          }
        });
    }

    return count;
  }
}
