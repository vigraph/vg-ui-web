import * as React from 'react';
import * as Model from './model';

import { vgData } from './data/Data';
import { vgUtils } from './lib/Utils';
import { vgConfig } from './lib/Config';

import Button from './controllers/Button';
import ColourPicker from './controllers/ColourPicker';
import Knob from './controllers/Knob';
import Selector from './controllers/Selector';
import Slider from './controllers/Slider';
import TextDisplay from './controllers/TextDisplay';
import Sequence from './controllers/Sequence';
import Curve from './controllers/Curve';

const controlTypes: {[key: string]: any} =
  { "none": null, "knob": Knob, "button": Button,
  "slider": Slider, "colourPicker": ColourPicker, "selector": Selector,
  "textDisplay": TextDisplay, "sequence": Sequence, "curve": Curve};

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

  // Main and Sub control types
  private controlType: string[];

  private relatedProperties?: { [key: string]: Model.Property};

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;
    this.controlType = this.property.controlType.split("/");

    if (this.controlType[0] === "knob" || this.controlType[0] === "slider")
    {
      // Ensure value conforms to increment bounds
      const snapValue = vgUtils.snapValueToIncrement(this.property.value,
        this.property.increment);
      if (this.property.value !== snapValue)
      {
        this.property.value = snapValue;
      }
    }

    this.relatedProperties = this.getRelatedProperties();

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
        className={`property-wrapper ${this.controlType[0]}
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
    const Component = controlTypes[this.controlType[0]];
    const position = this.property.position;
    const settingsType = (this.controlType[1] ?
      this.controlType[1] : "default");

    if (!Component)
    {
      if (this.property.propType === "setting" &&
        this.controlType[1] === "label")
      {
        return <text className={"settings label " + this.controlType[1]}
          fontSize={vgConfig.Graph.fontSize.propertySettings} x={0} y={0}>
            {this.property.value}
          </text>
      }
      else
      {
        return "";
      }
    }
    else if (this.controlType[0] === "curve")
    {
      const curveSize =
        { w: this.props.parent.size.w - position.x - (2 * this.props.padding),
          h: this.props.parent.size.h - position.y - (2 * this.props.padding) };

      return <Curve property={this.property}
          position={{x: position.x, y: position.y}}
          startUpdate={this.startPropertyUpdate} update={this.propertyUpdate}
          endUpdate={this.endPropertyUpdate} disabled={controlDisabled}
          settingsType={settingsType}
          size={curveSize}/>
    }
    else if (this.controlType[0] === "colourPicker")
    {
      const colourValues: {hex?: string, h?: number, s?: number, l?: number,
        r?: number, g?: number, b?: number} = {};

      if (this.relatedProperties)
      {
        const rProps = this.relatedProperties;

        colourValues.hex = (rProps.hex ? rProps.hex.value : undefined);
        colourValues.h = (rProps.h ? rProps.h.value : undefined);
        colourValues.s = (rProps.s ? rProps.s.value : undefined);
        colourValues.l = (rProps.l ? rProps.l.value : undefined);
        colourValues.r = (rProps.r ? rProps.r.value : undefined);
        colourValues.g = (rProps.g ? rProps.g.value : undefined);
        colourValues.b = (rProps.b ? rProps.b.value : undefined);
      }

      return <ColourPicker property={this.property}
          position={{x: position.x, y: position.y}}
          startUpdate={this.startPropertyUpdate} update={this.propertyUpdate}
          endUpdate={this.endPropertyUpdate} disabled={controlDisabled}
          settingsType={settingsType} colourValues={colourValues}/>
    }
    else
    {
      return <Component property={this.property}
          position={{x: position.x, y: position.y}}
          startUpdate={this.startPropertyUpdate} update={this.propertyUpdate}
          endUpdate={this.endPropertyUpdate} disabled={controlDisabled}
          settingsType={settingsType}/>
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
      },
      () =>
      {
        // Reset UI to actual property value on failure
        this.setState({value: this.property.value});
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

  // Return current property and any related properties e.g. all individual
  // colour properties for colourPicker
  private getRelatedProperties = () =>
  {
    let relatedProperties = {};

    if (this.controlType[0] === "colourPicker")
    {
      const properties = this.props.parent.getProperties();

      const hex = properties.find(x => x.id === "hex");

      relatedProperties =
      {
        hex: properties.find(x => x.id === "hex"),
        h: properties.find(x => x.id === "h"),
        s: properties.find(x => x.id === "s"),
        l: properties.find(x => x.id === "l"),
        r: properties.find(x => x.id === "r"),
        g: properties.find(x => x.id === "g"),
        b: properties.find(x => x.id === "b")
      };
    }

    return relatedProperties;
  }

}
