// ViGraph UI model - Property class
// Copyright (c) Paul Clark 2019

// Proxy class representing a property in the graph
import { Graph } from './Graph';

export class Property
{
  public readonly id: string;
  public readonly parent: string;
  private graph: Graph;

  constructor(id: string, parent: string, graph: Graph)
  {
    this.id = id;
    this.parent = parent;
    this.graph = graph;
  }

  get controlType(): string
  {
    return this.graph.getPropertyProp(this.id, this.parent, "controlType");
  }

  get subType(): string
  {
    return this.graph.getPropertyProp(this.id, this.parent, "subType");
  }

  set subType(subType: string)
  {
    this.graph.setPropertyProp(this.id, this.parent, "subType", subType);
  }

  get position(): { x: number, y: number }
  {
    return this.graph.getPropertyProp(this.id, this.parent, "position");
  }

  set position(pos: { x: number, y: number })
  {
    this.graph.setPropertyProp(this.id, this.parent, "position", pos);
  }

  get value(): any
  {
    return this.graph.getPropertyProp(this.id, this.parent, "value");
  }

  set value(value: any)
  {
    this.graph.setPropertyProp(this.id, this.parent, "value", value);
  }

  get range(): { min: number, max: number }
  {
    return this.graph.getPropertyProp(this.id, this.parent, "range");
  }

  set range(range: { min: number, max: number })
  {
    this.graph.setPropertyProp(this.id, this.parent, "range", range);
  }

  get increment(): number
  {
    return this.graph.getPropertyProp(this.id, this.parent, "increment");
  }

  set increment(increment: number)
  {
    this.graph.setPropertyProp(this.id, this.parent, "increment", increment);
  }

}
