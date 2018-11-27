import * as React from 'react';

import * as Model from './model';

import './Edge.css';

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

    return (
      <svg>
        <path className="edge"
          d={`M${sx} ${sy} C ${sx + 100} ${sy} ${dx - 100} ${dy} ${dx} ${dy}`}
        />
      </svg>
    );
  }
}

