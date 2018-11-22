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
  private history: Array<Map<string, any>> = [];
  private historyIndex: number = 0;  // Index of current state

  public constructor()
  {
    // Create initial state
    this.history.push(Map<string, any>());
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

  public addNode(id: string, type: string)
  {
    this.state = this.state.setIn(["nodes", id, "type"], type);
  }

  public setNodePosition(id: string, pos: { x: number, y: number })
  {
    this.state = this.state.setIn(["nodes", id, "position"], pos);
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

