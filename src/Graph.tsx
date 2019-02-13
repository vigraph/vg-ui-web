import * as React from 'react';

import * as Model from './model';

import './Graph.css';

import Edge from './Edge';
import Node from './Node';
import Property from './Property';

interface IProps
{
  from?: any;
}

export default class Graph extends React.Component<IProps>
{
  private graph: Model.Graph = new Model.Graph();

  constructor(props: IProps)
  {
    super(props);
    if (props.from)
    {
      // Note we load the graph directly, not doing forceUpdate()
      this.graph.loadFrom(props.from);
    }
  }

  // Load a new graph after mounting
  public loadFrom(json: any)
  {
    this.graph = new Model.Graph();
    this.graph.loadFrom(json);
    this.forceUpdate();
  }

  public render()
  {
    return (
      <svg id="graph">
        <svg id="nodes">
          {
            this.graph.getNodes().map((node: Model.Node, i) =>
            {
              return <Node key={i} node={node}
                name={node.id + ": " + node.type}
                startDragUpdate={this.startDragUpdate}
                dragUpdate={this.dragUpdate}
                endDragUpdate={this.endDragUpdate}>
                {this.graph.getProperties(node.id).map(
                  (property: Model.Property, j) =>
                  {
                    return <Property key={j} property={property}
                      name={property.id}
                      startUpdate={this.startDragUpdate}
                      update={this.dragUpdate}
                      endUpdate={this.endDragUpdate}/>
                  })}
              </Node>
            })
          }
        </svg>
        <svg id="edges">
          {
            this.graph.getNodes().map((node: Model.Node, i) =>
              Array.from(node.getForwardEdges(),
                ([output, to]) =>
                {
                  return <Edge key={i} src={node} dest={to.dest} />
                })
            )
          }
        </svg>
        }
      </svg>
    );
  }

  public undo = () =>
  {
    this.graph.undo();
    this.forceUpdate();
  }

  public redo = () =>
  {
    this.graph.redo();
    this.forceUpdate();
  }

  private startDragUpdate = () =>
  {
    this.graph.beginTransaction();
  }

  private dragUpdate = () =>
  {
    this.forceUpdate();
  }

  private endDragUpdate = () =>
  {
    this.graph.commitTransaction();
  }
}
