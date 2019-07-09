import * as React from 'react';
import * as Model from './model';

import Property from './Property';

import { graphData } from './data/GraphData';
import { vgUtils } from './Utils'

interface IProps
{
  node: Model.Node;
  startUpdate: () => void;
  update: () => void;
  endUpdate: () => void;
  padding: number;
  propertiesDisplay: {labels: boolean; controls: boolean};
  graphRef: SVGSVGElement | null;
  removeNode: (node: Model.Node) => void;
  showNodeGraph: (parentNode: Model.Node, nodes: any[]) => void;
}

interface IState
{
  dragging: boolean;
  x: number;
  y: number;
  hover: boolean;
}

export default class Node extends React.Component<IProps, IState>
{
  // Reset state from node when not dragging - allows movement not by
  // dragging (e.g. undo/redo) to work
  public static getDerivedStateFromProps(props: IProps, state: any)
  {
    return state.dragging ? null :
      { x: props.node.position.x, y: props.node.position.y };
  }

  private node: Model.Node;
  private offsetX: number;
  private offsetY: number;
  private mouseDown: {x: number, y: number, t: number};

  constructor(props: IProps)
  {
    super(props);
    this.state =
      {
        dragging: false,
        x: props.node.position.x,
        y: props.node.position.y,
        hover: false
      };

    this.node = props.node;
    this.offsetX = 0;
    this.offsetY = 0;
    this.mouseDown = {x: 0, y: 0, t: 0};
  }

  public render()
  {
    const size = this.props.node.size;
    const padding = this.props.padding;

    const properties = this.node.getProperties();

    const deleteX = padding + size.w;
    const deleteY = size.h;

    const reverseEdges = this.node.getReverseEdges();

    return (
      <svg x={this.state.x} y={this.state.y}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}>
        <rect x={padding} width={size.w} height={size.h}
          className={`node ${this.state.dragging ? "dragging" : ""}`}
          onMouseDown={this.handleMouseDown}
          onContextMenu={this.handleContextMenu}
        />
        {this.state.hover && <svg className="delete-wrapper">
            <circle className="node-delete"
              cx={deleteX} cy={deleteY} r={8}
              onMouseDown={this.removeNode}/>
            <path className="delete-line" d={`M ${deleteX-5} ${deleteY-5} L` +
              `${deleteX+5} ${deleteY+5}`}/>
            <path className="delete-line" d={`M ${deleteX-5} ${deleteY+5} L` +
              `${deleteX+5} ${deleteY-5}`}/>
        </svg>}
        <text className={"node-label label " + this.props.node.id}
          x={(size.w/2)+padding} y={15}>{this.node.name}</text>
        {this.props.children}
        {properties.map((property: Model.Property, j) =>
          {
            return <Property key={j} property={property}
              name={property.id}
              parent={this.node}
              display={this.props.propertiesDisplay}
              startUpdate={this.props.startUpdate}
              update={this.props.update}
              endUpdate={this.props.endUpdate}
              showPropertyGraph={this.showGraphFromProperty}
              disabled={!!reverseEdges.find(x => x.inputId === property.id)}/>
          })}
        />
      </svg>
    );
  }

  // Do nothing - prevents browser context menu from showing
  private handleContextMenu = (e: React.MouseEvent<SVGRectElement>) =>
  {
    e.preventDefault();
    e.stopPropagation();
  }

  private handleMouseDown = (e: React.MouseEvent<SVGRectElement>) =>
  {
    e.stopPropagation();
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    this.setState({ dragging: true });

    const currentPosition = vgUtils.windowToSVGPosition(
      {x: e.pageX, y: e.pageY}, this.props.graphRef);

    const date = new Date();

    if (this.mouseDown.t && date.getTime() - this.mouseDown.t < 250 &&
      (this.node.elements || this.node.cloneGraph))
    {
      this.props.showNodeGraph(this.node, this.node.elements ?
        this.node.elements : this.node.cloneGraph);
      window.removeEventListener('mouseup', this.handleMouseUp);
      window.removeEventListener('mousemove', this.handleMouseMove);
      return;
    }

    this.mouseDown = {x: this.state.x, y: this.state.y, t: date.getTime()};

    this.offsetX = currentPosition.x - this.state.x;
    this.offsetY = currentPosition.y - this.state.y;
    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }
  }

  private handleMouseUp = (e: MouseEvent) =>
  {
    this.setState({ dragging: false });
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);

    if (this.mouseDown.x !== this.state.x || this.mouseDown.y !==
      this.state.y)
    {
      // Update graph layout data
      graphData.updateLayout(this.node.path, {x: this.state.x, y: this.state.y});
    }

    if (this.props.endUpdate)
    {
      this.props.endUpdate();
    }
  }

  private handleMouseMove = (e: MouseEvent) =>
  {
    const currentPosition = vgUtils.windowToSVGPosition(
      {x: e.pageX, y: e.pageY}, this.props.graphRef);

    if (this.state.dragging)
    {
      this.setState({
        x: currentPosition.x - this.offsetX,
        y: currentPosition.y - this.offsetY
      });
    }

    this.node.position = { x: this.state.x, y: this.state.y };
    if (this.props.update)
    {
      this.props.update();
    }
  }

  private handleMouseEnter = () =>
  {
    this.setState({hover: true});
  }

  private handleMouseLeave = () =>
  {
    this.setState({hover: false});
  }

  private removeNode = (e: React.MouseEvent<SVGCircleElement>) =>
  {
    e.stopPropagation();
    this.props.removeNode(this.node);
  }

  // Allow a property to provide and show a graph of given nodes
  private showGraphFromProperty = (nodes: any[]) =>
  {
    this.props.showNodeGraph(this.node, nodes);
  }
}

