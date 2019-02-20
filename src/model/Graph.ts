// ViGraph UI model - Graph class
// Copyright (c) Paul Clark 2018

// Implements a method-based interface but holds all internal state
// as immutable objects.  Our external interface is typed but internally
// we are untyped because typed immutable.js is just too painful.

// State structure:
// {
//   nodes: Map<id, {
//            type: string
//            forwardEdges: Map<output, { dest_id, dest_input }>
//            reverseEdges: Map<input, { src_id, src_output }>
//            position: { x, y },
//            properties: Map<id, {
//                                  id: string,
//                                  controlType: string,
//                                  subType: string,
//                                  position {x, y},
//                                  value: number,
//                                  maxValue: number
//                                }
//                  }>
// }

import { Map } from 'immutable';
import { Node } from './Node';
import { Property } from './Property';

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

  // Load a graph from the given JSON:
  // { nodes: [
  //     { id, type, x, y, w, h,
  //       edges: [ { output, dest_id, input } ]
  //       properties: [ { id, controlType, subType, x, y, value, maxValue } ]
  //     } ] }
  public loadFrom(json: any)
  {
    this.beginTransaction();
    for (const n of json.nodes)
    {
      const node = this.addNode(n.id, n.type || "?");
      node.position = { x: n.x || 0, y: n.y || 0 };
      node.size = { w: n.w || 50, h: n.h || 50 };
      if (n.edges)
      {
        for (const e of n.edges)
        {
          this.addEdge(n.id, e.output, e.dest, e.input);
        }
      }
      if (n.properties)
      {
        for (const p of n.properties)
        {
          const property = this.addProperty(n.id, p.id, p.controlType)
          property.subType = p.subType || "?";
          property.position = { x: p.x || 0, y: p.y || 0 };
          property.value = p.value || 0;
          property.maxValue = p.maxValue || 100;
        }
      }
    }
    this.commitTransaction();
    this.resetBaseline();
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

  public addEdge(srcId: string, srcOutput: string,
    destId: string, destInput: string)
  {
    this.state = this.state
      .setIn(["nodes", srcId, "forwardEdges", srcOutput],
        { destId, destInput })
      .setIn(["nodes", destId, "reverseEdges", destInput],
        { srcId, srcOutput });
  }

  // Get forward/reverse edges - returns map of output to {dest, input}
  public getNodeForwardEdges(id: string): Map<string,
    { destId: string, destInput: string }>
  {
    return this.state.getIn(["nodes", id, "forwardEdges"]);
  }

  public getNodeReverseEdges(id: string): Map<string,
    { srcId: string, srcOutput: string }>
  {
    return this.state.getIn(["nodes", id, "reverseEdges"]);
  }

  public addProperty(parentId: string, id: string, controlType: string)
  {
    this.state = this.state.setIn(["nodes", parentId, "properties", id,
      "controlType"], controlType);
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
    return properties.map((n, id) => new Property(id!, parentId, this)).toArray();
  }

  public getProperty(id: string, parentId: string): Property | null
  {
    const nodes: Map<string, any> = this.state.get("nodes");
    if (!nodes) { return null };
    const node: Map<string, any> = nodes.get(parentId);
    if (!node) { return null };
    const properties: Map<string, any> = node.get("properties");
    if (!properties) { return null };
    const property: Map<string, any> = nodes.get(id);
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
    if (this.state.equals(this.history[this.historyIndex-1]))
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

