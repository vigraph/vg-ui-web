import * as React from 'react';
import * as Model from './model';
import './Node.css';

interface IProps
{
  node: Model.Node;
  width: number;
  height: number;
  name: string;
}

interface IState
{
  dragging: boolean;
  x: number;
  y: number;
}

export default class Node extends React.Component<IProps, IState>
{
  public static defaultProps: Partial<IProps> =
    {
      height: 50,
      width: 100
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
    return (
      <svg x={this.state.x} y={this.state.y}>
        <rect width={this.props.width} height={this.props.height}
          className={`node ${this.state.dragging ? "dragging" : ""}`}
          onMouseDown={this.handleMouseDown}
        />
        <text className="label" x={10} y={20}>{this.props.name}</text>
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
  }

  private handleMouseUp = (e: MouseEvent) =>
  {
    this.node.position = { x: this.state.x, y: this.state.y };
    this.setState({ dragging: false });
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
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
  }
}

