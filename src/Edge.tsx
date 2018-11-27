import * as React from 'react';
import * as Model from './model';

interface IProps
{
  src: Model.Node;
  dest: Model.Node;
}

export default class Edge extends React.Component<IProps, {}>
{
  constructor(props: IProps)
  {
    super(props);
  }

  public render()
  {
    const sp = this.props.src.position;
    const ss = this.props.src.size;
    const sx = sp.x + ss.w;
    const sy = sp.y + ss.h / 2;

    const dp = this.props.dest.position;
    const ds = this.props.dest.size;
    const dx = dp.x;
    const dy = dp.y + ds.h / 2;

    // Calculate distance of control point as fraction of the distance,
    // with minimum - gives a nice smooth curve and long distance
    let cpx = (dx - sx) / 2;
    if (cpx < 100) { cpx = 100; }

    return (
      <svg>
        <path className="edge"
          d={`M${sx} ${sy} C ${sx + cpx} ${sy} ${dx - cpx} ${dy} ${dx} ${dy}`}
        />
      </svg>
    );
  }
}

