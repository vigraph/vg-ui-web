import * as React from 'react';

import { vgConfig } from './lib/Config';

interface IProps
{
  x: number;
  y: number;
  deletePressed: () => void;
}

interface IState
{
  pointerDown: boolean;
}

export default class Node extends React.Component<IProps, IState>
{
  private pointerDownTime: number;

  constructor(props: IProps)
  {
    super(props);

    this.pointerDownTime = 0;

    this.state =
    {
      pointerDown: false
    }
  }

  public render()
  {
    const x = this.props.x;
    const y = this.props.y;

    return <svg className="delete-wrapper" x={x} y={y}>
      <circle className="delete-icon" cx={0} cy={0} r={8}
        onPointerDown={this.handlePointerDown}
        onPointerUp={this.handlePointerUp}
        onPointerLeave={this.handlePointerLeave}/>
      {this.state.pointerDown &&
        <circle className="delete-icon-animate" cx={0} cy={0} r={8}/>}
      <path className="delete-line" d={`M ${-5} ${-5} L${5} ${5}`}/>
      <path className="delete-line" d={`M ${-5} ${5} L${5} ${-5}`}/>
      </svg>
  }

  private handlePointerDown = (e: React.PointerEvent<SVGCircleElement>) =>
  {
    e.stopPropagation();
    const date = new Date();
    this.pointerDownTime = date.getTime();
    this.setState({pointerDown: true});
  }

  private handlePointerUp = (e: React.PointerEvent<SVGCircleElement>) =>
  {
    e.stopPropagation();
    const date = new Date();
    const current = date.getTime();

    if (this.pointerDownTime &&
      current - this.pointerDownTime > (vgConfig.Graph.longPressTime*1000))
    {
      this.props.deletePressed();
    }
    this.setState({pointerDown: false});
  }

  private handlePointerLeave = (e: React.PointerEvent<SVGCircleElement>) =>
  {
    this.pointerDownTime = 0;
    this.setState({pointerDown: false});
  }
}
