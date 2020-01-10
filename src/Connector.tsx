import * as React from 'react';
import * as Model from './model';

interface IProps
{
  parent: Model.Node;
  connector: Model.Connector;
  inputConnectorSelected: (inNode: Model.Node, inConnector: Model.Connector,
    position: {x: number, y: number}) => void;
  outputConnectorSelected: (node: Model.Node, connector: Model.Connector,
    position: {x: number, y: number}, transactionStarted: boolean) => void;
  updateTargetConnector: (target: {connector: Model.Connector,
    parent: Model.Node } | null) => void;
  radius: number;
  position: {x: number, y: number};
}

export default class Connector extends React.Component<IProps>
{
  constructor(props: IProps)
  {
    super(props);
  }

  public render()
  {
    const position = this.props.position;
    const radius = this.props.radius;

    return (
      <svg id={`connector-${this.props.connector.id}`} className={"connector"}>
        <rect className={"connector-boundary " + this.props.connector.id}
          x={position.x} y={position.y-(2*radius)}
          width={radius*4} height={radius*4} onPointerEnter={this.pointerEnter}
          onPointerLeave={this.pointerLeave}
          onPointerDown={this.pointerDown} />
        <circle className={`connector-icon ${this.props.connector.id}` +
          ` ${this.props.connector.direction}`}
          cx={position.x+(2*radius)}
          cy={position.y}
          r={radius} />
      </svg>
    );
  }

  private pointerDown = (e: React.PointerEvent<SVGRectElement>) =>
  {
    e.stopPropagation();
    const connector = this.props.connector;

    if (connector.direction === "output")
    {
      this.props.outputConnectorSelected(this.props.parent,
        this.props.connector, {x: e.pageX, y: e.pageY}, false);
    }
    else if (connector.direction === "input" &&
      this.props.parent.edgesFromConnector(this.props.connector).length === 1)
    {
      this.props.inputConnectorSelected(this.props.parent, this.props.connector,
        {x: e.pageX, y: e.pageY});
    }
  }

  private pointerEnter = (e: React.PointerEvent<SVGRectElement>) =>
  {
    this.props.updateTargetConnector({connector: this.props.connector,
      parent: this.props.parent});
  }

  private pointerLeave = (e: React.PointerEvent<SVGRectElement>) =>
  {
    this.props.updateTargetConnector(null);
  }

}
