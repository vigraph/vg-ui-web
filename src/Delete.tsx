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
  private hoverTimer: number | null;

  constructor(props: IProps)
  {
    super(props);

    this.hoverTimer = null;

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
        onPointerDown={this.handlePointerDown}/>
      {this.state.pointerDown &&
        <circle className="delete-icon-animate" cx={0} cy={0} r={8}/>}
      <path className="delete-line" d={`M ${-5} ${-5} L${5} ${5}`}/>
      <path className="delete-line" d={`M ${-5} ${5} L${5} ${-5}`}/>
      </svg>
  }

  private handlePointerDown = (e: React.PointerEvent<SVGCircleElement>) =>
  {
    e.stopPropagation();
    this.setState({pointerDown: true});

    this.hoverTimer = window.setTimeout(() =>
    {
      window.removeEventListener("pointerdown", this.handlePointerUp);
      this.props.deletePressed();
    }, vgConfig.Graph.longPressTime * 1000);

    window.addEventListener("pointerup", this.handlePointerUp);
  }

  private handlePointerUp = (e: PointerEvent) =>
  {
    e.stopPropagation();

    if (this.hoverTimer)
    {
      window.clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }

    this.setState({pointerDown: false});
    window.removeEventListener("pointerdown", this.handlePointerUp);
  }
}
