import * as React from 'react';
import * as Model from './model';

interface IProps
{
  node: Model.Node;
  name: string;
  startDragUpdate: () => void;
  dragUpdate: () => void;
  endDragUpdate: () => void;
  padding: number;
}

interface IState
{
  dragging: boolean;
  x: number;
  y: number;
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

  public name: string;
  private node: Model.Node;
  private offsetX: number;
  private offsetY: number;

  constructor(props: IProps)
  {
    super(props);
    this.state =
      {
        dragging: false,
        x: props.node.position.x,
        y: props.node.position.y
      };

    this.node = props.node;
    this.offsetX = 0;
    this.offsetY = 0;
    this.name = props.name;
  }

  public render()
  {
    const size = this.props.node.size;
    const padding = this.props.padding;

    return (
      <svg x={this.state.x} y={this.state.y}>
        <rect x={padding} width={size.w} height={size.h}
          className={`node ${this.state.dragging ? "dragging" : ""}`}
          onMouseDown={this.handleMouseDown}
        />
        <text className={"label " + this.props.node.id}
          x={20} y={20}>{this.props.name}</text>
        {this.props.children}
        />
      </svg>
    );
  }

  private handleMouseDown = (e: React.MouseEvent<SVGRectElement>) =>
  {
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    this.setState({ dragging: true });
    this.offsetX = e.pageX - this.state.x;
    this.offsetY = e.pageY - this.state.y;
    if (this.props.startDragUpdate)
    {
      this.props.startDragUpdate();
    }
  }

  private handleMouseUp = (e: MouseEvent) =>
  {
    this.setState({ dragging: false });
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    if (this.props.endDragUpdate)
    {
      this.props.endDragUpdate();
    }
  }

  private handleMouseMove = (e: MouseEvent) =>
  {
    if (this.state.dragging)
    {
      this.setState({
        x: e.pageX - this.offsetX,
        y: e.pageY - this.offsetY
      });
    }
    this.node.position = { x: this.state.x, y: this.state.y };
    if (this.props.dragUpdate)
    {
      this.props.dragUpdate();
    }
  }
}

