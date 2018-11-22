// ViGraph UI model - Graph class
// Copyright (c) Paul Clark 2018

// Implements a method-based interface but holds all internal state
// as immutable objects.  Our external interface is typed but internally
// we are untyped because typed immutable.js is just too painful.

// State structure:
// {
//   nodes: Map<id, {
//            type: string
//            display: map<prop, any>
//                  }>
// }

import { Map } from 'immutable';
import { Node } from './Node';

export class Graph
{
  private state: Map<string, any> = Map<string, any>();

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

  public addNode(id: string, type: string)
  {
    this.state = this.state.setIn(["nodes", id, "type"], type);
  }

  public setNodePosition(id: string, pos: { x: number, y: number })
  {
    this.state = this.state.setIn(["nodes", id, "position"], pos);
  }
}

