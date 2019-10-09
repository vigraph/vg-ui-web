import * as React from 'react';
import * as Model from './model';

import { vgData } from './data/Data';
import { vgUtils } from './lib/Utils';

import Button from './Button';
import ColourPicker from './ColourPicker';
import Knob from './Knob';
import Selector from './Selector';
import Slider from './Slider';
import GraphSelector from './GraphSelector';
import TextDisplay from './TextDisplay';
import Sequence from './Sequence';
import Curve from './Curve';

const settingsFontSize: number = 10;

const controlTypes: {[key: string]: any} =
  { "none": null, "knob": Knob, "button": Button,
  "slider": Slider, "colourPicker": ColourPicker, "selector": Selector,
  "graphSelector": GraphSelector, "textDisplay": TextDisplay,
  "sequence": Sequence, "curve": Curve};

interface IProps
{
  property: Model.Property;
  parent: Model.Node;
  name: string;
  startUpdate: () => void;
  update: () => void;
  endUpdate: () => void;
  showNodeGraph: (path: string, pathSpecific?: string,
    sourceSpecific?: string) => void;
  padding: number;
  updateTargetProperty: (updateID: string, property: Model.Property | null,
    updating: boolean) => void;
}

interface IState
{
  value: any;
  updating: boolean;
  hover: boolean;
}

export default class Property extends React.Component<IProps, IState>
{
  // Reset state from property when not updating - allows movement not by
  // updating (e.g. undo/redo) to work
  public static getDerivedStateFromProps(props: IProps, state: any)
  {
    return state.updating ? null :
      { value: props.property.value };
  }

  private property: Model.Property;

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    // Knobs and sliders are numerical and snap to increments.
    if (this.property.controlType === "knob" || this.property.controlType ===
      "slider")
    {
      // Ensure value conforms to increment bounds
      const snapValue = vgUtils.snapValueToIncrement(this.property.value,
        this.property.increment);
      if (this.property.value !== snapValue)
      {
        this.property.value = snapValue;
      }
    }

    this.state =
    {
      value: this.property.value,
      updating: false,
      hover: false
    };
  }

  public render()
  {
    const position = this.property.position;
    const controlDisabled = this.property.hasConnection();

    return(
      <svg id={this.props.name.toLowerCase()+"-property"}
        className={`property-wrapper ${this.property.controlType}
          ${controlDisabled ? "disabled" : ""}`}
        x={position.x} y={position.y}
        onMouseEnter={this.mouseEnter}
        onMouseLeave={this.mouseLeave}>

        {this.createComponent(controlDisabled)}
      </svg>
    );
  }

  // Create component to allow for special cases
  private createComponent = (controlDisabled: boolean) =>
  {
    const Component = controlTypes[this.property.controlType];
    const position = this.property.position;

    if (!Component)
    {
      if (this.property.propType === "setting" &&
        this.property.subType !== "none")
      {
        return <text className={"settings label " + this.property.subType}
          fontSize={settingsFontSize} x={this.property.position.x}
          y={this.property.position.y}>{this.property.value}</text>
      }
      else
      {
        return "";
      }
    }
    else if (this.property.controlType === "graphSelector")
    {
      return <GraphSelector property={this.property}
          position={{x: position.x, y: position.y}}
          startUpdate={this.startPropertyUpdate} update={this.propertyUpdate}
          endUpdate={this.endPropertyUpdate}
          disabled={controlDisabled}
          showGraph={this.props.showNodeGraph}
          updateGraphs={this.nonPropertyUpdate}
          parentPath={this.props.parent.path}/>
    }
    else if (this.property.controlType === "curve")
    {
      const curveSize =
        { w: this.props.parent.size.w - position.x - (2 * this.props.padding),
          h: this.props.parent.size.h - position.y - (2 * this.props.padding) };

      return <Curve property={this.property}
          position={{x: position.x, y: position.y}}
          startUpdate={this.startPropertyUpdate} update={this.propertyUpdate}
          endUpdate={this.endPropertyUpdate} disabled={controlDisabled}
          size={curveSize}/>
    }
    else
    {
      return <Component property={this.property}
          position={{x: position.x, y: position.y}}
          startUpdate={this.startPropertyUpdate} update={this.propertyUpdate}
          endUpdate={this.endPropertyUpdate} disabled={controlDisabled}/>
    }
  }

  private startPropertyUpdate = () =>
  {
    this.setState({updating: true});
    this.props.updateTargetProperty(this.property.id, this.property, true);

    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }
  }

  private endPropertyUpdate = () =>
  {
    this.setState({updating: false});
    this.props.updateTargetProperty(this.property.id, this.state.hover ?
      this.property : null, false);

    if (this.props.endUpdate)
    {
      this.props.endUpdate();
    }
  }

  private propertyUpdate = (value: any) =>
  {
    const newValue = this.property.valueType === "number" ?
      vgUtils.snapValueToIncrement(value, this.property.increment) : value;

    this.setState({value: newValue});

    vgData.updateProperty(this.props.parent.path, this.property.id, value,
      () =>
      {
        this.property.value = newValue;

        if (this.props.update)
        {
          this.props.update();
        }
      });
  }

  // Update a non-property value in parent node
  private nonPropertyUpdate = (data: any) =>
  {
    vgData.updateNode(this.props.parent.path, data,
      () =>
      {
        if (this.props.update)
        {
          this.props.update();
        }
      });
  }

  private mouseEnter = (event: React.MouseEvent<SVGSVGElement>) =>
  {
    this.setState({hover: true});
    if (!this.state.updating)
    {
      this.props.updateTargetProperty(this.property.id, this.property, false);
    }
  }

  private mouseLeave = (event: React.MouseEvent<SVGSVGElement>) =>
  {
    this.setState({hover: false});
    if (!this.state.updating)
    {
      this.props.updateTargetProperty(this.property.id, null, false);
    }
  }

}
