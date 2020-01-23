import * as React from 'react';

import { vgConfig } from './lib/Config';

interface IProps
{
  x: number;
  y: number;
  radius: number;
  deletePressed: () => void;
}

export default class Node extends React.Component<IProps>
{
  private pointerDownTime: number;

  constructor(props: IProps)
  {
    super(props);

    this.pointerDownTime = 0;
  }

  public render()
  {
    const x = this.props.x;
    const y = this.props.y;

    return <svg className="delete-wrapper">
      <circle className="edge-delete" cx={x} cy={y} r={8}
        onPointerDown={this.handlePointerDown}
        onPointerUp={this.handlePointerUp}/>
      <path className="delete-line" d={`M ${x-5} ${y-5} L${x+5} ${y+5}`}/>
      <path className="delete-line" d={`M ${x-5} ${y+5} L${x+5} ${y-5}`}/>
      </svg>
  }

  private handlePointerDown = (e: React.PointerEvent<SVGCircleElement>) =>
  {
    e.stopPropagation();
    const date = new Date();
    this.pointerDownTime = date.getTime();
  }

  private handlePointerUp = (e: React.PointerEvent<SVGCircleElement>) =>
  {
    e.stopPropagation();
    const date = new Date();
    const current = date.getTime();

    if (current - this.pointerDownTime > (vgConfig.Graph.longPressTime*1000))
    {
      this.props.deletePressed();
    }
  }
}
