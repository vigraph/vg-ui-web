import * as React from 'react';
import * as Model from './model';

import { vgData } from './data/Data';

import Button from './Button';
import ColourPicker from './ColourPicker';
import Knob from './Knob';
import Selector from './Selector';
import Slider from './Slider';
import GraphSelector from './GraphSelector';
import TextDisplay from './TextDisplay';
import Sequence from './Sequence';
import Curve from './Curve';

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
  disabled: boolean;
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
  private numerical: boolean;

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    // Buttons, knobs and sliders are numerical and snap to increments. All
    // other types e.g. selectors and colourPicker are not numerical.
    if (this.property.controlType === "knob" || this.property.controlType ===
      "slider")
    {
      this.numerical = true;

      // Ensure value conforms to increment bounds
      const snapValue = this.snapValueToIncrement(this.property.value);
      if (this.property.value !== snapValue)
      {
        this.property.value = snapValue;
      }
    }
    else
    {
      this.numerical = false;
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

    let displayValue = "";

    if (this.numerical && typeof this.property.value === "number")
    {
      displayValue = this.property.value.toString();
    }
    else if (typeof this.property.value === "string")
    {
      displayValue = this.property.value;
    }

    return(
      <svg id={this.props.name.toLowerCase()+"-property"}
        className={`property-wrapper ${this.property.controlType}
          ${this.props.disabled ? "disabled" : ""}`}
        x={position.x} y={position.y}
        onMouseEnter={this.mouseEnter}
        onMouseLeave={this.mouseLeave}>

        {this.createComponent()}

        {(this.state.hover || this.state.updating) ?
          <text className="label property-label" x={0} y={0}>
          {this.props.name + ": " + displayValue}</text> : ""}
      </svg>
    );
  }

  // Create component to allow for special cases
  private createComponent = () =>
  {
    const Component = controlTypes[this.property.controlType];
    const position = this.property.position;

    if (!Component)
    {
      return "";
    }
    else if (this.property.controlType === "graphSelector")
    {
      return <GraphSelector property={this.property}
          position={{x: position.x, y: position.y}}
          startUpdate={this.startPropertyUpdate} update={this.propertyUpdate}
          endUpdate={this.endPropertyUpdate}
          disabled={this.props.disabled}
          showGraph={this.props.showNodeGraph}
          updateGraphs={this.nonPropertyUpdate}
          parentPath={this.props.parent.path}/>
    }
    else
    {
      return <Component property={this.property}
          position={{x: position.x, y: position.y}}
          startUpdate={this.startPropertyUpdate} update={this.propertyUpdate}
          endUpdate={this.endPropertyUpdate} disabled={this.props.disabled}/>
    }
  }

  private startPropertyUpdate = () =>
  {
    this.setState({updating: true});

    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }
  }

  private endPropertyUpdate = () =>
  {
    this.setState({updating: false});

    if (this.props.endUpdate)
    {
      this.props.endUpdate();
    }
  }

  private propertyUpdate = (value: any) =>
  {
    const newValue = this.numerical && typeof value === "number" ?
      this.snapValueToIncrement(value) : value;

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

  // Snap value to closest increment
  // Return value is rounded to the same accuracy as the increment
  private snapValueToIncrement = (value: number) =>
  {
    const increment = this.property.increment;

    const split = increment.toString().split(".");
    const decimalPlaces = split[1] ? split[1].length : 0;
    const multiplier = (Math.pow(10, decimalPlaces));

    const iValue = Math.round(Math.abs(value) * multiplier);
    const iIncrement = Math.round(increment * multiplier);

    const mod = iValue % iIncrement;
    const diff = iValue - mod;

    // Snap to the closest increment
    const snap = (mod > iIncrement/2) ? iIncrement : 0;
    const nValue = diff + snap;

    const newValue = (nValue / multiplier) * Math.sign(value);

    return newValue;
  }

  private mouseEnter = (event: React.MouseEvent<SVGSVGElement>) =>
  {
    this.setState({hover: true});
  }

  private mouseLeave = (event: React.MouseEvent<SVGSVGElement>) =>
  {
    this.setState({hover: false});
  }

}
