import * as React from 'react';
import * as Model from '../model';

import { vgConfig } from '../lib/Config';
import { vgUtils } from '../lib/Utils';
import * as vgTypes from '../lib/Types';

interface IProps
{
  property: Model.Property;
  startUpdate: () => void;
  update: (value: {}) => void;
  endUpdate: () => void;
  position: {x: number, y:number};
  disabled: boolean;
  settingsType: string;
  colourValues: {hex?: string, r?: number, g?: number, b?: number, h?: number,
    s?: number, l?: number};
}

interface IState
{
  currentValue: number | string;
  picking: boolean;
}

export default class ColourPicker extends React.Component<IProps, IState>
{
  // Reset state from colour picker when not picking - allows movement not by
  // picking (e.g. undo/redo) to work
  public static getDerivedStateFromProps(props: IProps, state: any)
  {
    return state.picking ? null : { currentValue: props.property.value };
  }

  private settings: vgTypes.IColourPickerSettings;

  private pickerRef: SVGSVGElement | null;

  private gradKey: string;

  constructor(props: IProps)
  {
    super(props);

    this.pickerRef = null;

    const pickerSettings = vgConfig.Controls.colourPicker;

    this.settings = pickerSettings[this.props.settingsType] ?
      pickerSettings[this.props.settingsType] : pickerSettings.default;

    this.state =
    {
      currentValue: props.property.value,
      picking: false
    };

    this.gradKey = "";
  }

  public render()
  {
    this.gradKey =
      JSON.stringify(this.props.colourValues).replace(/:|,|"/g,'');

    return(
      <svg id="colour-picker-wrapper" className={this.props.settingsType}
        ref={(ref) => { this.pickerRef = ref; }}>

        { this.createColourDisplay() }
        { this.createPicker() }

      </svg>
    );
  }

  private createColourDisplay = () =>
  {
    const display = this.settings.displaySize;
    if (display)
    {
      let hex = "";
      const colours = this.props.colourValues;

      if (colours.hex)
      {
        hex = colours.hex;
      }
      else if (colours.h !== undefined && colours.s !== undefined &&
        colours.l !== undefined)
      {
        hex = vgUtils.rgbToHex(vgUtils.hslToRGB({h: colours.h, s: colours.s,
          l: colours.l}));
      }
      else if (colours.r !== undefined && colours.g !== undefined &&
        colours.b !== undefined)
      {
        hex = vgUtils.rgbToHex({r: colours.r, g: colours.g, b: colours.b});
      }

      return  <svg id="colour-display" className="display"
        x={0} y={0}>
        <rect className="colour-display" width={display} height={display}
          fill={hex} />
      </svg>
    }
  }

  private createPicker = () =>
  {
    const colours = this.props.colourValues;

    if (this.props.property.id === "h" && colours.s !== undefined &&
      colours.l !== undefined)
    {
      const s = colours.s;
      const l = colours.l;

      return this.createPickerByName("hue", (value: string, i: number) =>
        {
          return <stop key={i} offset={i*10+"%"}
            stopColor={"hsl("+(36*i)+", "+s*100+"%, "+l*100+"%)"} />
        });
    }
    else if (this.props.property.id === "s" && colours.h !== undefined &&
      colours.l !== undefined)
    {
      const h = colours.h;
      const l = colours.l;

      return this.createPickerByName("saturation", (value: string, i:number) =>
        {
          return <stop key={i} offset={i*10+"%"}
            stopColor={"hsl("+(h*360)+", "+i*10+"%, "+(l*100)+"%)"} />
        });
    }
    else if (this.props.property.id === "l" && colours.h !== undefined &&
      colours.s !== undefined)
    {
      const h = colours.h;
      const s = colours.s;

      return this.createPickerByName("lightness", (value: string, i:number) =>
        {
          return <stop key={i} offset={i*10+"%"}
            stopColor={"hsl("+(h*360)+", "+(s*100)+"%, "+i*10+"%)"} />
        });
    }
    else if (this.props.property.id === "r" && colours.g !== undefined &&
      colours.b !== undefined)
    {
      const g = colours.g;
      const b = colours.b;

      return this.createPickerByName("red", (value: string, i:number) =>
        {
          return <stop key={i} offset={i*10+"%"}
            stopColor={"rgb("+(i*25.5)+", "+(g*255)+", "+(b*255)+")"} />
        });
    }
    else if (this.props.property.id === "g" && colours.r !== undefined &&
      colours.b !== undefined)
    {
      const r = colours.r;
      const b = colours.b;

      return this.createPickerByName("green", (value: string, i:number) =>
        {
          return <stop key={i} offset={i*10+"%"}
            stopColor={"rgb("+(r*255)+", "+(i*25.5)+", "+(b*255)+")"} />
        });
    }
    else if (this.props.property.id === "b" && colours.r !== undefined &&
      colours.g !== undefined)
    {
      const r = colours.r;
      const g = colours.g;

      return this.createPickerByName("blue", (value: string, i:number) =>
        {
          return <stop key={i} offset={i*10+"%"}
            stopColor={"rgb("+(r*255)+", "+(g*255)+", "+(i*25.5)+")"} />
        });
    }
  }

  private createPickerByName = (name: string,
    gradientFunction: (value: string, i: number) => {}) =>
  {
    // Dummy array to create gradients more easily
    const gradientArray = ["","","","","","","","","",""];
    const settings = this.settings;
    const x = settings.displaySize + settings.padding;

    return <svg id="colour-picker" className={name} x={x} y={0}>

      <linearGradient id={name+"-gradient-"+this.gradKey} x1="0%" y1="0%"
        x2="100%" y2="0%">
      {
        gradientArray.map(gradientFunction)
      }
      </linearGradient>

      <svg id={"picker-bar-"+name} className={"picker " + name}>

        <rect id={name} className={"picker-background " + name}
        width={settings.barLength} height={settings.barThickness}
        fill={"url(#"+name+"-gradient-"+this.gradKey+")"}
        onMouseDown={this.handleMouseDown}
        onMouseMove={this.handleMouseMove} />

        {this.createIndicators()}

      </svg>
    </svg>
  }

  private createIndicators = () =>
  {
    const disabled = this.props.disabled;
    const position = (this.props.property.value ? ((this.props.property.value *
      this.settings.barLength) + this.settings.indicatorThickness) : 0);

    return <svg className="indicator-wrapper"
      x={-this.settings.indicatorThickness}>

      <polygon className={"picker-indicator indicator-top " +
        (disabled ? "disabled" : "")}
        points={(position - (this.settings.indicatorThickness / 2)) + ",0 " +
        position + "," + this.settings.indicatorThickness + " " + (position +
        (this.settings.indicatorThickness / 2)) + ",0"} />

      <polygon className={"picker-indicator indicator-bottom " +
        (disabled ? "disabled" : "")}
        points={(position - (this.settings.indicatorThickness / 2)) + "," +
        this.settings.barThickness + " " + position + "," +
        (this.settings.barThickness - this.settings.indicatorThickness) + " " +
        (position + (this.settings.indicatorThickness / 2)) + "," +
        this.settings.barThickness} />

    </svg>
  }

  private handleMouseDown = (e: React.MouseEvent<SVGElement>) =>
  {
    e.stopPropagation();

    if (this.props.disabled)
    {
      return;
    }

    window.addEventListener('mouseup', this.handleMouseUp);

    this.setState({picking: true});

    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }

    this.updateValue(e);
  }

  private handleMouseMove = (e: React.MouseEvent<SVGElement>) =>
  {
    if (this.state.picking)
    {
      this.updateValue(e);
    }
  }

  private updateValue = (e: React.MouseEvent<SVGElement>) =>
  {
    const svgPosition = vgUtils.windowToSVGPosition({x: e.pageX, y: e.pageY},
        this.pickerRef);

    const settings = this.settings;
    const position = svgPosition.x - (settings.displaySize + settings.padding);
    const newValue = position / settings.barLength;

    this.setState({currentValue: newValue});

    if (this.props.update)
    {
      this.props.update(newValue);
    }
  }

  private handleMouseUp = (e: MouseEvent) =>
  {
    window.removeEventListener('mouseup', this.handleMouseUp);

    this.setState({picking: false});

    if (this.props.endUpdate)
    {
      this.props.endUpdate();
    }
  }
}
