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
  nodePadding: number;
}

export default class Connector extends React.Component<IProps>
{
  constructor(props: IProps)
  {
    super(props);
  }

  public render()
  {
    const radius = this.props.radius;

    return (
      <svg id={`connector-${this.props.parent.id}-${this.props.connector.id}`}
        className={"connector"}>
        <rect className={"connector-boundary " + this.props.connector.id}
          x={this.props.position.x + this.props.nodePadding - (2*radius)}
          y={this.props.position.y - (2*radius)}
          width={radius*4} height={radius*4} onPointerEnter={this.pointerEnter}
          onPointerLeave={this.pointerLeave} onPointerDown={this.pointerDown} />
        <path className={`connector-icon ${this.props.connector.id}` +
          ` ${this.props.connector.direction} ${this.props.connector.type}`}
          d={this.pathForType(this.props.connector.type)}
          />
      </svg>
    );
  }

  private pathForType = (type: string) =>
  {
    const radius = this.props.radius;
    const position = this.props.position;
    const nodePad = this.props.nodePadding;

    if (type === "number")
    {
      return `M${position.x + nodePad} ${position.y} L${position.x + nodePad}` +
        ` ${position.y - radius} A ${radius} ${radius} 0 0 1` +
        ` ${position.x + nodePad} ${position.y + radius} Z`;
    }
    else if (type === "trigger")
    {
      return `M${position.x + nodePad} ${position.y + radius}` +
        ` L${position.x + nodePad} ${position.y - radius}` +
        ` L${position.x + nodePad + radius} ${position.y} Z`;
    }
    else
    {
      return `M${position.x + nodePad} ${position.y + radius}` +
        ` L${position.x + nodePad} ${position.y - radius}` +
        ` L${position.x + nodePad + radius} ${position.y - radius}` +
        ` L${position.x + nodePad + radius} ${position.y + radius} Z`;
    }
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
