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
    const dp = this.props.dest.position;
    return (
      <svg>
        <path className="edge"
          d={`M${sp.x} ${sp.y} C ${sp.x + 100} ${sp.y} ${dp.x - 100} ${dp.y} ${dp.x} ${dp.y}`} />
      </svg>
    );
  }
}

