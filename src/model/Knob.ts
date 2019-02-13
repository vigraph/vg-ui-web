// ViGraph UI model - Knob class
// Copyright (c) Paul Clark 2019

// Proxy class representing a knob in the graph
import { Graph } from './Graph';

export class Knob
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

  get type(): string
  {
    return this.graph.getKnobProp(this.id, this.parent, "type");
  }

  get position(): { x: number, y: number }
  {
    return this.graph.getKnobProp(this.id, this.parent, "position");
  }

  set position(pos: { x: number, y: number })
  {
    this.graph.setKnobProp(this.id, this.parent, "position", pos);
  }

  get start(): number
  {
    return this.graph.getKnobProp(this.id, this.parent, "start");
  }

  set start(start: number)
  {
    this.graph.setKnobProp(this.id, this.parent, "start", start);
  }

  get maxValue(): number
  {
    return this.graph.getKnobProp(this.id, this.parent, "maxValue");
  }

  set maxValue(value: number)
  {
    this.graph.setKnobProp(this.id, this.parent, "maxValue", value);
  }

}
