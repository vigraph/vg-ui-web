// ViGraph UI model - Graph class
// Copyright (c) Paul Clark 2018

// Implements a method-based interface but holds all internal state
// as immutable objects.  Our external interface is typed but internally
// we are untyped because typed immutable.js is just too painful.

// State structure:
// {
//   nodes: Map<id, {
//            name: string
//            type: string
//            inputs: Map<id, { connectorType: string, multiple: boolean }>
//            outputs: Map<id, { connectorType: string, multiple: boolean }>
//            forwardEdges: Map<output, List<{ destId: string, destInput: string }>>
//            reverseEdges: Map<input, List<{ srcId: string, srcOutput: string }>>
//            position: { x, y },
//            size: { w, h },
//            properties: Map<id, {
//                                  propType: string,
//                                  controlType: string,
//                                  subType: string,
//                                  position: {x, y},
//                                  value: number,
//                                  range: {min, max},
//                                  increment: number
//                                }
//                  }>
// }

import { List } from 'immutable';
import { Map } from 'immutable';
import { Connector } from './Connector';
import { Node } from './Node';
import { Property } from './Property';
import { vgUtils } from '../Utils';

export class Graph
{
  private history: Array<Map<string, any>> = [];
  private historyIndex: number = 0;  // Index of current state
  private inTransaction: boolean = false;

  public constructor()
  {
    // Create initial state
    this.history.push(Map<string, any>());
  }

  //
  // Load a graph from the given JSON:
  // { nodes: [
  //     { id, name, type, x, y, w, h,
  //       inputs: [ { id, connectorType, multiple }],
  //       outputs: [ { id, connectorType, multiple }],
  //       edges: [ { output, destId, input } ]
  //       properties: [ { id, propType, controlType, subType, x, y, value,
  //                       rangeMin, rangeMax, increment } ]
  //     } ] }
  public loadFrom(json: any)
  {
    this.beginTransaction();
    // First pass to create nodes, connectors and properties
    for (const n of json.nodes)
    {
      this.addNodeFromJSON(n);
    }

    // Second pass to create edges
    for (const n of json.nodes)
    {
      if (n.edges)
      {
        for (const e of n.edges)
        {
          this.addEdge(n.id, e.output, e.destId, e.input);
        }
      }
    }

    this.commitTransaction();
    this.resetBaseline();
  }

  public addNodeFromJSON(n: any)
  {
    const node = this.addNode(n.id, n.type || "?");
    node.name = n.name || n.id;
    node.position = { x: n.x || 0, y: n.y || 0 };
    node.size = { w: n.w || 50, h: n.h || 50 };
    if (n.inputs)
    {
      for (const i of n.inputs)
      {
        const input = this.addNodeInput(n.id, i.id, i.connectorType);
        input.multiple = i.multiple || false;
        input.position = { x: 0,
          y: ((node.size.h)/(n.inputs.length+1))*(n.inputs.indexOf(i)+1)};
      }
    }

    if (n.outputs)
    {
      for (const o of n.outputs)
      {
        const input = this.addNodeOutput(n.id, o.id, o.connectorType);
        input.multiple = o.multiple || false;
        input.position = { x: node.size.w,
          y: ((node.size.h)/(n.outputs.length+1))*(n.outputs.indexOf(o)+1)};
      }
    }

    if (n.properties)
    {
      for (const p of n.properties)
      {
        const property = this.addProperty(n.id, p.id, p.propType);
        property.controlType = p.controlType || "default"
        property.subType = p.subType || "?";
        property.position = { x: p.x || 0, y: p.y || 0 };
        property.value = p.value || 0;
        property.range = { min: p.rangeMin || 0, max: p.rangeMax || 1};
        property.increment = p.increment || 1;
        property.available = p.available || [];
      }
    }
  }

  public getNodes(): Node[]
  {
    const nodes: Map<string, any> = this.state.get("nodes");
    if (!nodes) { return []; }
    return nodes.map((n, id) => new Node(id!, this)).toArray();
  }

  public getNode(id: string): Node | null
  {
    const nodes: Map<string, any> = this.state.get("nodes");
    if (!nodes) { return null };
    const node: Map<string, any> = nodes.get(id);
    if (!node) { return null };
    return new Node(id, this);
  }

  public getNodeProp(id: string, prop: string): any
  {
    return this.state.getIn(["nodes", id, prop]);
  }

  public setNodeProp(id: string, prop: string, value: any)
  {
    this.state = this.state.setIn(["nodes", id, prop], value);
  }

  public addNode(id: string, type: string)
  {
    this.state = this.state.setIn(["nodes", id, "type"], type);
    return new Node(id, this);
  }

  public removeNode(id: string)
  {
    this.state = this.state.deleteIn(["nodes", id]);
  }

  public addNodeInput(parentId: string, id: string, connectorType: string)
  {
    this.state = this.state.setIn(["nodes", parentId, "inputs", id,
      "connectorType"], connectorType);

    // Initialise reverse edge list for this input connector
    if (!this.state.getIn(["nodes", parentId, "reverseEdges", id]))
    {
      this.state = this.state.setIn(["nodes", parentId, "reverseEdges",
        id], List<{destId: string, destInput: string}>());
    }

    return new Connector(id, parentId, "input", this);
  }

  public addNodeOutput(parentId: string, id: string, connectorType: string)
  {
    this.state = this.state.setIn(["nodes", parentId, "outputs", id,
      "connectorType"], connectorType);

    // Initialise forward edge list for this output connector
    if (!this.state.getIn(["nodes", parentId, "forwardEdges", id]))
    {
      this.state = this.state.setIn(["nodes", parentId, "forwardEdges",
        id], List<{destId: string, destInput: string}>());
    }

    return new Connector(id, parentId, "output", this);
  }

  public getNodeConnectorProp(id: string, parentId: string, type: string,
    prop: string): any
  {
    const ioType = (type === "input") ? "inputs" : "outputs";
    return this.state.getIn(["nodes", parentId, ioType, id, prop]);
  }

  public setNodeConnectorProp(id: string, parentId: string, type: string,
    prop: string, value: any)
  {
    const ioType = (type === "input") ? "inputs" : "outputs";
    this.state = this.state.setIn(["nodes", parentId, ioType, id, prop], value);
  }

  public getNodeConnectors(parentId: string, type: string): Connector[]
  {
    const ioType = (type === "input") ? "inputs" : "outputs";

    const nodes: Map<string, any> = this.state.get("nodes");
    if (!nodes) { return []; };
    const node: Map<string, any> = nodes.get(parentId);
    if (!node) { return []; };
    const inputs: Map<string, any> = node.get(ioType);
    if (!inputs) { return []; };
    return inputs.map((n, id) =>
      new Connector(id!, parentId, type, this)).toArray();
  }

  public getNodeConnector(id: string, parentId: string, type: string):
    Connector | null
  {
    const ioType = (type === "input") ? "inputs" : "outputs";

    const nodes: Map<string, any> = this.state.get("nodes");
    if (!nodes) { return null };
    const node: Map<string, any> = nodes.get(parentId);
    if (!node) { return null };
    const connectors: Map<string, any> = node.get(ioType);
    if (!connectors) { return null };
    const connector: Map<string, any> = connectors.get(id);
    if (!connector) { return null };
    return new Connector(id, parentId, type, this);
  }

  public addEdge(srcId: string, srcOutput: string,
    destId: string, destInput: string)
  {
    const srcConnector = this.getNodeConnector(srcOutput, srcId, "output");
    const destConnector = this.getNodeConnector(destInput, destId, "input");

    if (srcConnector && destConnector && (srcConnector.connectorType ===
      destConnector.connectorType))
    {
      this.state = this.state
        .setIn(["nodes", srcId, "forwardEdges", srcOutput],
          this.state.getIn(["nodes", srcId, "forwardEdges", srcOutput]).push(
            { destId, destInput }))
        .setIn(["nodes", destId, "reverseEdges", destInput],
          this.state.getIn(["nodes", destId, "reverseEdges", destInput]).push(
            { srcId, srcOutput }));
    }
}

  public removeEdge(srcId: string, srcOutput: string,
    destId: string, destInput: string)
  {
    if (!this.getNode(srcId) || !this.state.getIn(["nodes", srcId,
      "forwardEdges", srcOutput]))
    {
      vgUtils.log("Graph removeEdge Error: Node " + srcId + " or Output " +
        srcOutput + " not found");
      return;
    }

    if (!this.getNode(destId) || !this.state.getIn(["nodes", destId,
      "reverseEdges", destInput]))
    {
      vgUtils.log("Graph removeEdge Error: Node " + destId + " or Input " +
        destInput + " not found");
      return;
    }

    this.state = this.state
        .deleteIn(["nodes", srcId, "forwardEdges", srcOutput,
          this.state.getIn(["nodes", srcId, "forwardEdges",
          srcOutput]).findIndex((value: {destId: string, destInput: string}) =>
            value.destId === destId && value.destInput === destInput)])
        .deleteIn(["nodes", destId, "reverseEdges", destInput,
          this.state.getIn(["nodes", destId, "reverseEdges",
          destInput]).findIndex((value: {srcId: string, srcOutput: string}) =>
            value.srcId === srcId && value.srcOutput === srcOutput)]);
  }

  // Get forward/reverse edges - returns map of output to {dest, input}
  public getNodeForwardEdges(id: string): Map<string,
    [{ destId: string, destInput: string }]>
  {
    return this.state.getIn(["nodes", id, "forwardEdges"]);
  }

  public getNodeReverseEdges(id: string): Map<string,
    [{ srcId: string, srcOutput: string }]>
  {
    return this.state.getIn(["nodes", id, "reverseEdges"]);
  }

  public addProperty(parentId: string, id: string, propType: string)
  {
    this.state = this.state.setIn(["nodes", parentId, "properties", id,
      "propType"], propType);
    return new Property(id, parentId, this);
  }

  public getPropertyProp(id: string, parentId: string, prop: string): any
  {
    return this.state.getIn(["nodes", parentId, "properties", id, prop]);
  }

  public setPropertyProp(id: string, parentId: string, prop: string, value: any)
  {
    this.state = this.state.setIn(["nodes", parentId, "properties", id, prop],
      value);
  }

  public getProperties(parentId: string): Property[]
  {
    const nodes: Map<string, any> = this.state.get("nodes");
    if (!nodes) { return []; };
    const node: Map<string, any> = nodes.get(parentId);
    if (!node) { return []; };
    const properties: Map<string, any> = node.get("properties");
    if (!properties) { return []; };
    return properties.map((n, id) =>
      new Property(id!, parentId, this)).toArray();
  }

  public getProperty(id: string, parentId: string): Property | null
  {
    const nodes: Map<string, any> = this.state.get("nodes");
    if (!nodes) { return null };
    const node: Map<string, any> = nodes.get(parentId);
    if (!node) { return null };
    const properties: Map<string, any> = node.get("properties");
    if (!properties) { return null };
    const property: Map<string, any> = properties.get(id);
    if (!property) { return null };
    return new Property(id, parentId, this);
  }

  // Transactions - used for temporary changes which might or might not get
  // committed to the model - e.g. dragging
  public beginTransaction()
  {
    // Rollback any existing, for safety
    this.rollbackTransaction();

    // Clone top state as transient one
    this.state = this.state;  // Set get/set below!

    this.inTransaction = true;
  }

  public rollbackTransaction()
  {
    if (this.inTransaction)
    {
      this.undo();
      this.inTransaction = false;
    }
  }

  public commitTransaction()
  {
    if (this.inTransaction)
    {
      // Just leave current state
      this.inTransaction = false;
    }

    // Current and previous states are equal (nothing changed in the last
    // transaction) so undo state
    if (JSON.stringify(this.state) ===
      JSON.stringify(this.history[this.historyIndex-1]))
    {
      this.undo();
    }
  }

  // Undo / redo state
  public resetBaseline()
  {
    if (this.historyIndex > 0)
    {
      this.history = this.history.slice(this.historyIndex);
      this.historyIndex = 0;
    }
  }

  public undo()
  {
    if (this.historyIndex > 0)
    {
      this.historyIndex--;
    }
  }

  public redo()
  {
    if (this.historyIndex < this.history.length - 1)
    {
      this.historyIndex++;
    }
  }

  private get state(): Map<string, any>
  {
    return this.history[this.historyIndex];
  }

  private set state(state: Map<string, any>)
  {
    if (this.inTransaction)
    {
      // Just replace top one
      this.history.pop();
      this.history.push(state);
    }
    else
    {
      // Move forward
      this.historyIndex++;

      // Chop off anything after this in forward (redo) history
      if (this.history.length > this.historyIndex)
      {
        this.history = this.history.slice(0, this.historyIndex);
      }
      this.history.push(state);
    }
  }
}
