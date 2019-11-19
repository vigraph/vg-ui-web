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

  get propType(): string
  {
    return this.graph.getPropertyProp(this.id, this.parent, "propType");
  }

  get description(): string
  {
    return this.graph.getPropertyProp(this.id, this.parent, "description");
  }

  set description(description: string)
  {
    this.graph.setPropertyProp(this.id, this.parent, "description", description);
  }

  get valueType(): string
  {
    return this.graph.getPropertyProp(this.id, this.parent, "valueType");
  }

  set valueType(valueType: string)
  {
    this.graph.setPropertyProp(this.id, this.parent, "valueType", valueType);
  }

  get valueFormat(): string
  {
    return this.graph.getPropertyProp(this.id, this.parent, "valueFormat");
  }

  set valueFormat(valueFormat: string)
  {
    this.graph.setPropertyProp(this.id, this.parent, "valueFormat", valueFormat);
  }

  get controlType(): string
  {
    return this.graph.getPropertyProp(this.id, this.parent, "controlType");
  }

  set controlType(controlType: string)
  {
    this.graph.setPropertyProp(this.id, this.parent, "controlType", controlType);
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

  // Return if the property has a connection
  public hasConnection(): boolean
  {
    // Only input propTypes can have a connection
    if (this.propType !== "input")
    {
      return false;
    }
    else
    {
      const node = this.graph.getNode(this.parent);

      if (node)
      {
        const reverseEdges = node.getReverseEdges();
        return !!reverseEdges.find(x => x.inputId === this.id)
      }
      else
      {
        return false;
      }
    }
  }

}
