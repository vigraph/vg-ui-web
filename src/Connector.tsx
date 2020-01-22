import * as React from 'react';
import * as Model from './model';

import { vgConfig } from './lib/Config';
import { vgUtils } from './lib/Utils';

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
        {vgConfig.Graph.debugMode.enabled && this.createDebugLabel()}
      </svg>
    );
  }

  // Connector icon path
  private pathForType = (type: string) =>
  {
    const r = this.props.radius;
    const x = this.props.position.x + this.props.nodePadding;
    const y = this.props.position.y;

    if (type === "number")
    {
      return `M${x} ${y} L${x} ${y - r} A ${r} ${r} 0 0 1 ${x} ${y + r} Z`;
    }
    else if (type === "trigger")
    {
      return `M${x} ${y + r} L${x} ${y - r} L${x + r} ${y} Z`;
    }
    else if (type === "audio")
    {
      return `M${x} ${y + r/2} L${x + r} ${y + r} L${x + r} ${y - r}` +
        ` L${x} ${y - r/2} Z`;
    }
    else if (type === "frame")
    {
      return `M${x} ${y + r} L${x} ${y - r} L${x + r} ${y - r} L${x + r}` +
        ` ${y + r} Z`;
    }
    else if (type === "waveform")
    {
      return `M${x} ${y + r} L${x + r/2} ${y + r} L${x + r} ${y}` +
        ` L${x + r/2} ${y - r} L${x} ${y - r} Z`;
    }
    else if (type === "filter-mode")
    {
      return `M${x} ${y + r} L${x} ${y - r} L${x + r} ${y - r} Z`;
    }
    else if (type === "midi")
    {
      return `M${x} ${y + r} L${x + r} ${y + r} L${x + r/2} ${y} L${x + r}` +
        ` ${y - r} L${x} ${y - r} Z `
    }
    else if (type === "oscilloscope-slope")
    {
      return `M${x} ${y - r} A ${r} ${r} 0 0 1 ${x + r} ${y} L${x} ${y} Z`;
    }
    else if (type === "dataset")
    {
      return `M${x} ${y - r/2} A ${r} ${r/2} 0 0 1 ${x} ${y + r/2} Z`;
    }
    else if (type === "colour")
    {
      return `M${x} ${y - r} L${x + r/2} ${y - r} A ${r/2} ${r} 0 0 1` +
        ` ${x + r/2} ${y + r} L${x} ${y + r} Z`;
    }
    else
    {
      return `M${x} ${y + r/2} L${x} ${y - r/2} L${x + r/2} ${y - r/2}` +
        ` L${x + r/2} ${y + r/2} Z`;
    }
  }

  private createDebugLabel = () =>
  {
    const radius = this.props.radius;
    const fontSize = vgConfig.Graph.debugMode.connectorLabelText;
    const textBox = vgUtils.textBoundingSize(
      this.props.connector.sampleRate.toString(), fontSize);

    return <svg id={"connector-debug-label"}
        x={this.props.position.x + this.props.nodePadding + radius}
        y={this.props.position.y-radius}>
      <rect id={"connector-sample-rate"}
        className={"connector-debug sample-rate label-background"}
        width={textBox.width+2} height={fontSize+2}/>
      <text id={"connector-sample-rate-text"} x={1} y={1}
        fontSize={fontSize}
        className={"label debug"}>{this.props.connector.sampleRate}</text>
      }
    </svg>
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
