import * as React from 'react';
import * as Model from './model';

import { vgUtils } from './Utils'

const pickerSettings: {default: {}} =
{
  default: {barLength: 100, barThickness: 15, padding: 5, indicatorThickness: 6}
}

interface IProps
{
  property: Model.Property;
  startUpdate: () => void;
  update: (value: {}) => void;
  endUpdate: () => void;
  position: {x: number, y:number};
}

interface IState
{
  // Current Value is Colour Hex (#rrggbb)
  currentValue: string
  picking: boolean;
  showPicker: boolean;
}

export default class ColourPicker extends React.Component<IProps, IState>
{
  // Reset state from colour picker when not picking - allows movement not by
  // picking (e.g. undo/redo) to work
  public static getDerivedStateFromProps(props: IProps, state: any)
  {
    return state.picking ? null :
      { currentValue: props.property.value };
  }

  private property: Model.Property;

  private settings: {barLength: number, barThickness: number, padding: number,
    indicatorThickness: number};

  private allCurrentValues: {hex: string, r: number, g: number, b: number, h: number,
    s: number, l: number};

  private pickerRef: SVGSVGElement | null;

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    this.settings = pickerSettings[this.property.subType] ?
      pickerSettings[this.property.subType] : pickerSettings.default;

    this.state =
    {
      currentValue: this.property.value,
      picking: false,
      showPicker: false
    };
  }

  public render()
  {
    const position = this.props.position;
    const currentValue = this.state.currentValue;
    this.updateAllFromHex(currentValue);

    return(
        <svg id="colour-picker" className={this.property.subType}
          ref={(ref) => { this.pickerRef = ref; }}
          x={position.x} y={position.y}>

          <svg id="colour-display" className="display"
            x={0} y={0}>
            <rect className="colour-display"
              width={20} height={20}
              fill={currentValue}
              onMouseDown={this.togglePickerShow} />
          </svg>

          {
            this.state.showPicker && this.createPicker()
          }
        </svg>
    );
  }

  private togglePickerShow = (e: React.MouseEvent<SVGElement>) =>
  {
    e.stopPropagation();
    const show = !this.state.showPicker;
    this.setState({showPicker: show});
  }

  private createPicker = () =>
  {
    const settings = this.settings;
    const padding = settings.padding;

    // Dummy array to create gradients more easily
    const gradientArray = ["","","","","","","","","",""];

    const currentH = this.allCurrentValues.h
    const currentS = this.allCurrentValues.s;
    const currentL = this.allCurrentValues.l;
    const currentR = this.allCurrentValues.r;
    const currentG = this.allCurrentValues.g;
    const currentB = this.allCurrentValues.b;

    const positionH = currentH * settings.barLength;
    const positionS = currentS * settings.barLength;
    const positionL = currentL * settings.barLength;
    const positionR = currentR * settings.barLength;
    const positionG = currentG * settings.barLength;
    const positionB = currentB * settings.barLength;

    return <svg id="colour-picker">
      <linearGradient id="hue-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        {
          gradientArray.map((value: string, i:number) =>
          {
            return <stop key={i} offset={i*10+"%"}
              stopColor={"hsl("+(36*i)+", 100%, 50%)"} />
          })
        }
      </linearGradient>

      <linearGradient id="saturation-gradient" x1="0%" y1="0%"
        x2="100%" y2="0%">
        {
          gradientArray.map((value: string, i:number) =>
          {
            return <stop key={i} offset={i*10+"%"}
              stopColor={"hsl("+(currentH*360)+", "+i*10+"%, "+
                (currentL*100)+"%)"} />
          })
        }
      </linearGradient>

      <linearGradient id="lightness-gradient" x1="0%" y1="0%"
        x2="100%" y2="0%">
        {
          gradientArray.map((value: string, i:number) =>
          {
            return <stop key={i} offset={i*10+"%"}
              stopColor={"hsl("+(currentH*360)+", "+(currentS*100)+"%, "+i*10+
                "%)"} />
          })
        }
      </linearGradient>

      <linearGradient id="red-gradient" x1="0%" y1="0%"
        x2="100%" y2="0%">
        {
          gradientArray.map((value: string, i:number) =>
          {
            return <stop key={i} offset={i*10+"%"}
              stopColor={"rgb("+(i*25.5)+", "+(currentG*255)+", "+
                (currentB*255)+")"} />
          })
        }
      </linearGradient>

      <linearGradient id="green-gradient" x1="0%" y1="0%"
        x2="100%" y2="0%">
        {
          gradientArray.map((value: string, i:number) =>
          {
            return <stop key={i} offset={i*10+"%"}
              stopColor={"rgb("+(currentR*255)+", "+(i*25.5)+", "+
                (currentB*255)+")"} />
          })
        }
      </linearGradient>

      <linearGradient id="blue-gradient" x1="0%" y1="0%"
        x2="100%" y2="0%">
        {
          gradientArray.map((value: string, i:number) =>
          {
            return <stop key={i} offset={i*10+"%"}
              stopColor={"rgb("+(currentR*255)+", "+(currentG*255)+", "+
                (i*25.5)+")"} />
          })
        }
      </linearGradient>

      <svg id="picker-wrapper" className="picker wrapper"
        x={30} y={0}>

        <rect className="picker-wrapper-background" x={0} y={0}
          width={settings.barLength + (padding * 2)}
          height={(settings.barThickness * 6) + (padding * 7)}
        />

        <svg id="picker-bar-hue" className="picker hue"
          x={padding} y={padding}>
          <rect id="hue" className="picker-background hue"
          width={settings.barLength} height={settings.barThickness}
          fill="url(#hue-gradient)"
          onMouseDown={this.handleMouseDownHSL}
          onMouseMove={this.handleMouseMoveHSL} />
          {this.createIndicators(positionH)}
        </svg>

        <svg id="picker-bar-saturation" className="picker saturation"
          x={padding}
          y={settings.barThickness + (padding * 2)}>
          <rect id="saturation" className="picker-background saturation"
          width={settings.barLength} height={settings.barThickness}
          fill="url(#saturation-gradient)"
          onMouseDown={this.handleMouseDownHSL}
          onMouseMove={this.handleMouseMoveHSL} />
          {this.createIndicators(positionS)}
        </svg>

        <svg id="picker-bar-lightness" className="picker lightness"
          x={padding}
          y={(settings.barThickness * 2) + (padding * 3)}>
          <rect id="lightness" className="picker-background lightness"
          width={settings.barLength} height={settings.barThickness}
          fill="url(#lightness-gradient)"
          onMouseDown={this.handleMouseDownHSL}
          onMouseMove={this.handleMouseMoveHSL} />
          {this.createIndicators(positionL)}
        </svg>

        <svg id="picker-bar-red" className="picker red"
          x={padding}
          y={(settings.barThickness * 3) + (padding * 4)}>
          <rect id="red" className="picker-background red"
          width={settings.barLength} height={settings.barThickness}
          fill="url(#red-gradient)"
          onMouseDown={this.handleMouseDownRGB}
          onMouseMove={this.handleMouseMoveRGB} />
          {this.createIndicators(positionR)}
        </svg>

        <svg id="picker-bar-green" className="picker green"
          x={padding}
          y={(settings.barThickness * 4) + (padding * 5)}>
          <rect id="green" className="picker-background green"
          width={settings.barLength} height={settings.barThickness}
          fill="url(#green-gradient)"
          onMouseDown={this.handleMouseDownRGB}
          onMouseMove={this.handleMouseMoveRGB} />
          {this.createIndicators(positionG)}
        </svg>

        <svg id="picker-bar-blue" className="picker blue"
          x={padding}
          y={(settings.barThickness * 5) + (padding * 6)}>
          <rect id="blue" className="picker-background blue"
          width={settings.barLength} height={settings.barThickness}
          fill="url(#blue-gradient)"
          onMouseDown={this.handleMouseDownRGB}
          onMouseMove={this.handleMouseMoveRGB} />
          {this.createIndicators(positionB)}
        </svg>

      </svg>
    </svg>
  }

  private createIndicators = (position: number) =>
  {
    position = position + this.settings.indicatorThickness;
    return <svg className="indicator-wrapper"
            x={-this.settings.indicatorThickness}>
            <polygon className="picker-indicator indicator-top"
              points={(position - (this.settings.indicatorThickness / 2)) +
              ",0 " + position + "," +this.settings.indicatorThickness +
              " " + (position + (this.settings.indicatorThickness / 2)) +
              ",0"} />
            <polygon className="picker-indicator indicator-bottom"
              points={(position - (this.settings.indicatorThickness / 2)) +
              "," + this.settings.barThickness + " " + position + "," +
              (this.settings.barThickness - this.settings.indicatorThickness) +
              " " + (position + (this.settings.indicatorThickness / 2)) +
              "," + this.settings.barThickness} />
          </svg>
  }

  private handleMouseDownHSL = (e: React.MouseEvent<SVGElement>) =>
  {
    e.stopPropagation();
    window.addEventListener('mouseup', this.handleMouseUp);

    this.setState({picking: true});

    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }

    this.updateHSL(e, e.currentTarget.id);
  }

  private handleMouseMoveHSL = (e: React.MouseEvent<SVGElement>) =>
  {
    if (this.state.picking)
    {
      this.updateHSL(e, e.currentTarget.id);
    }
  }

  private updateHSL = (e: React.MouseEvent<SVGElement>, attr: string) =>
  {
    const svgPosition = vgUtils.windowToSVGPosition({x: e.pageX, y: e.pageY},
        this.pickerRef);

    const position = svgPosition.x - this.props.position.x + this.settings.padding;
    const newAttr = position / this.settings.barLength;
    const newValue = JSON.parse(JSON.stringify(this.allCurrentValues));

    switch (attr)
    {
      case ("hue"):
        newValue.h = newAttr;
        break;
      case ("saturation"):
        newValue.s = newAttr;
        break;
      case ("lightness"):
        newValue.l = newAttr;
        break;
    }

    const rgb = this.hslToRGB(newValue.h*360, newValue.s, newValue.l);

    newValue.r = rgb.r;
    newValue.g = rgb.g;
    newValue.b = rgb.b;

    newValue.hex = this.rgbToHex(rgb);

    this.allCurrentValues = newValue;

    this.setState({currentValue: newValue.hex});

    if (this.props.update)
    {
      this.props.update(newValue.hex);
    }
  }

  private handleMouseDownRGB = (e: React.MouseEvent<SVGElement>) =>
  {
    e.stopPropagation();
    window.addEventListener('mouseup', this.handleMouseUp);

    this.setState({picking: true});

    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }

    this.updateRGB(e, e.currentTarget.id);
  }

  private handleMouseMoveRGB = (e: React.MouseEvent<SVGElement>) =>
  {
    if (this.state.picking)
    {
      this.updateRGB(e, e.currentTarget.id);
    }
  }

  private updateRGB = (e: React.MouseEvent<SVGElement>, attr: string) =>
  {
    const svgPosition = vgUtils.windowToSVGPosition({x: e.pageX, y: e.pageY},
      this.pickerRef);

    const position = svgPosition.x - this.props.position.x + this.settings.padding;
    const newAttr = position / this.settings.barLength;
    const newValue = JSON.parse(JSON.stringify(this.allCurrentValues));

    switch (attr)
    {
      case ("red"):
        newValue.r = newAttr;
        break;
      case ("green"):
        newValue.g = newAttr;
        break;
      case ("blue"):
        newValue.b = newAttr;
        break;
    }

    const hsl = this.rgbToHSL(newValue.r, newValue.g, newValue.b);

    newValue.hex = this.rgbToHex(newValue);

    newValue.h = hsl.h / 360;
    newValue.s = hsl.s;
    newValue.l = hsl.l;

    this.allCurrentValues = newValue;

    this.setState({currentValue: newValue.hex});

    if (this.props.update)
    {
      this.props.update(newValue.hex);
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

  // h: [0..360], s: [0..1], l: [0..1]
  private hslToRGB = (h: number, s: number, l: number) =>
  {
    const hueToRGB = (t1: number, t2: number, hue: number) =>
    {
      if (hue < 0)
      {
        hue += 6;
      }

      if (hue >= 6)
      {
        hue -= 6;
      }

      if (hue < 1)
      {
        return (t2 - t1) * hue + t1;
      }
      else if(hue < 3)
      {
        return t2;
      }
      else if(hue < 4)
      {
        return (t2 - t1) * (4 - hue) + t1;
      }
      else
      {
        return t1;
      }
    }

    let test2;
    h = h / 60;

    if ( l <= 0.5 )
    {
      test2 = l * (s + 1);
    }
    else
    {
      test2 = l + s - (l * s);
    }

    const test1 = l * 2 - test2;

    return {r : hueToRGB(test1, test2, h + 2), g : hueToRGB(test1, test2, h),
      b : hueToRGB(test1, test2, h - 2)};
}


  // input - r, g, b: [0..1]
  // output - h: [0..360], s: [0..1], l: [0..1]
  private rgbToHSL = (r: number, g: number, b: number) =>
  {
    const rgb = [r, g, b];

    let min = rgb[0];
    let max = rgb[0];
    let maxColour = 0;

    let h;
    let l;
    let s;

    for (let i = 0; i < rgb.length - 1; i++)
    {
      if (rgb[i + 1] <= min)
      {
        min = rgb[i + 1];
      }

      if (rgb[i + 1] >= max)
      {
        max = rgb[i + 1];
        maxColour = i + 1;
      }
    }

    switch (maxColour)
    {
      case (0):
        h = (rgb[1] - rgb[2]) / (max - min);
        break;
      case (1):
        h = 2 + (rgb[2] - rgb[0]) / (max - min);
        break;
      case (2):
        h = 4 + (rgb[0] - rgb[1]) / (max - min);
        break;
    }

    if (typeof h === "undefined" || isNaN(h))
    {
      h = 0;
    }

    h = h * 60;
    if (h < 0)
    {
      h = h + 360;
    }

    l = (min + max) / 2;

    if (min === max)
    {
      s = 0;
    }
    else
    {
      if (l < 0.5)
      {
        s = (max - min) / (max + min);
      }
      else
      {
        s = (max - min) / (2 - max - min);
      }
    }

    return {h, s, l};
    }

    // input - r, g, b: [0..1]
    private rgbToHex = (rgb: {r: number, g: number, b: number}) =>
    {
      const toHex = (colour: number) =>
      {
        let hex = Math.round(colour * 255).toString(16);
        if (hex.length < 2)
        {
          hex = "0" + hex;
        }
        return hex;
      }

      return "#" + toHex(rgb.r) + toHex(rgb.g) + toHex(rgb.b);
    }

    private hexToRGB = (hex: string) =>
    {
      hex = hex.replace('#','');
      const r = parseInt(hex.substring(0,2), 16) / 255;
      const g = parseInt(hex.substring(2,4), 16) / 255;
      const b = parseInt(hex.substring(4,6), 16) / 255;

      return {r, g, b};
    }

    private updateAllFromHex = (hex: string) =>
    {
      const rgb = this.hexToRGB(this.state.currentValue);
      const hsl = this.rgbToHSL(rgb.r, rgb.g, rgb.b);
      hsl.h = hsl.h / 360;

      this.allCurrentValues = {hex: this.state.currentValue, ...rgb, ...hsl};
    }
}
