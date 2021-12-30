import * as React from 'react';
import Node from './Node';

export default class KnobNode extends Node
{
  public render()
  {
    const node = this.props.node;

    return (
      <svg id={`node-${node.id}`}
           className={"node " + node.type.replace("/","-") + " " +
                    (node.category ? node.category : "")}
           x={this.state.x} y={this.state.y}>
        {this.createIcon()}
        {this.props.children}
      </svg>
    );
  }
}

