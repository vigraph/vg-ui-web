import * as React from 'react';
import * as Model from './model';

const pickerSettings: {default: {}} =
{
  default: {barLength: 100, barThickness: 20, padding: 10, indicatorThickness: 6}
}

interface IProps
{
  property: Model.Property;
  startUpdate: () => void;
  update: (value: string) => void;
  endUpdate: () => void;
}

interface IState
{
  currentValue: string;
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

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    this.settings = pickerSettings[this.property.subType] ?
      pickerSettings[this.property.subType] : pickerSettings.default;

    this.state =
    {
      currentValue: this.property.value.toString(),
      picking: false,
      showPicker: false
    };
  }

  public render()
  {
    const position = this.property.position;
    const settings = this.settings;

    const currentAttributes = this.valueToHSL(this.property.value.toString());
    const currentH = currentAttributes.h;
    const currentS = currentAttributes.s;
    const currentL = currentAttributes.l;

    const positionH = (currentH/360) * settings.barLength;
    const positionS = (currentS/100) * settings.barLength;
    const positionL = (currentL/100) * settings.barLength;

    // Dummy array to create gradients more easily
    const gradientArray = ["","","","","","","","","",""];

    return(
        <svg id="colour-picker" className={this.property.subType}
          x={position.x} y={position.y+10}>

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
                  stopColor={"hsl("+currentH+", "+i*10+"%, "+currentL+"%)"} />
              })
            }
          </linearGradient>

          <linearGradient id="lightness-gradient" x1="0%" y1="0%"
            x2="100%" y2="0%">
            {
              gradientArray.map((value: string, i:number) =>
              {
                return <stop key={i} offset={i*10+"%"}
                  stopColor={"hsl("+currentH+", "+currentS+"%, "+i*10+"%)"} />
              })
            }
          </linearGradient>

          <svg id="colour-display" className="display"
            x={0} y={0}>
            <rect className="colour-display"
              width={20} height={20}
              fill={"hsl("+currentH+","+currentS+"%,"+currentL+"%)"}
              onMouseDown={this.togglePickerShow} />
          </svg>

          {
            this.state.showPicker &&
              <svg id="picker-wrapper" className="picker wrapper"
                x={30} y={0}>

                <rect className="picker-wrapper-background" x={0} y={0}
                  width={settings.barLength + (settings.padding * 2)}
                  height={(settings.barThickness * 3) + (settings.padding * 4)}
                />

                <svg id="picker-bar-hue" className="picker hue"
                  x={settings.padding} y={settings.padding}>
                  <rect className="picker-background"
                  width={settings.barLength} height={settings.barThickness}
                  fill="url(#hue-gradient)"
                  onMouseDown={this.handleMouseDownHue}
                  onMouseMove={this.handleMouseMoveHue} />
                  {this.createIndicators(positionH)}
                </svg>

                <svg id="picker-bar-saturation" className="picker saturation"
                  x={settings.padding}
                  y={settings.barThickness + (2* settings.padding)}>
                  <rect className="picker-background saturation"
                  width={settings.barLength} height={settings.barThickness}
                  fill="url(#saturation-gradient)"
                  onMouseDown={this.handleMouseDownSaturation}
                  onMouseMove={this.handleMouseMoveSaturation} />
                  {this.createIndicators(positionS)}
                </svg>

                <svg id="picker-bar-lightness" className="picker lightness"
                  x={settings.padding}
                  y={(settings.barThickness * 2) + (settings.padding * 3)}>
                  <rect className="picker-background lightness"
                  width={settings.barLength} height={settings.barThickness}
                  fill="url(#lightness-gradient)"
                  onMouseDown={this.handleMouseDownLightness}
                  onMouseMove={this.handleMouseMoveLightness} />
                  {this.createIndicators(positionL)}
                </svg>

              </svg>
          }
        </svg>
    );
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

  private togglePickerShow = (e: React.MouseEvent<SVGElement>) =>
  {
    const show = !this.state.showPicker;
    this.setState({showPicker: show});
  }

  private handleMouseDownHue = (e: React.MouseEvent<SVGElement>) =>
  {
    window.addEventListener('mouseup', this.handleMouseUp);

    this.setState({picking: true});

    const position = e.pageX - e.currentTarget.getBoundingClientRect().left;
    const percent = position / this.settings.barLength;
    const newHue = Math.floor(percent * 360);

    const newValue = this.updateSingleAttribute("hue", newHue);

    this.setState({currentValue: newValue});

    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }

    if (this.props.update)
    {
      this.props.update(newValue);
    }
  }

  private handleMouseMoveHue = (e: React.MouseEvent<SVGElement>) =>
  {
    if (this.state.picking)
    {
      const position = e.pageX - e.currentTarget.getBoundingClientRect().left;
      const percent = position / this.settings.barLength;
      const newHue = Math.floor(percent * 360);

      const newValue = this.updateSingleAttribute("hue", newHue);

      this.setState({currentValue: newValue});

      if (this.props.update)
      {
        this.props.update(newValue);
      }
    }
  }

  private handleMouseDownSaturation = (e: React.MouseEvent<SVGElement>) =>
  {
    window.addEventListener('mouseup', this.handleMouseUp);

    this.setState({picking: true});

    const position = e.pageX - e.currentTarget.getBoundingClientRect().left;
    const percent = position / this.settings.barLength;
    const newSat = Math.floor(percent * 100);

    const newValue = this.updateSingleAttribute("saturation", newSat);

    this.setState({currentValue: newValue});

    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }

    if (this.props.update)
    {
      this.props.update(newValue);
    }
  }

  private handleMouseMoveSaturation = (e: React.MouseEvent<SVGElement>) =>
  {
    if (this.state.picking)
    {
      const position = e.pageX - e.currentTarget.getBoundingClientRect().left;
      const percent = position / this.settings.barLength;
      const newSat = Math.floor(percent * 100);

      const newValue = this.updateSingleAttribute("saturation", newSat);

      this.setState({currentValue: newValue});

      if (this.props.update)
      {
        this.props.update(newValue);
      }
    }
  }

    private handleMouseDownLightness = (e: React.MouseEvent<SVGElement>) =>
  {
    window.addEventListener('mouseup', this.handleMouseUp);

    this.setState({picking: true});

    const position = e.pageX - e.currentTarget.getBoundingClientRect().left;
    const percent = position / this.settings.barLength;
    const newLight = Math.floor(percent * 100);

    const newValue = this.updateSingleAttribute("lightness", newLight);

    this.setState({currentValue: newValue});

    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }

    if (this.props.update)
    {
      this.props.update(newValue);
    }
  }

  private handleMouseMoveLightness = (e: React.MouseEvent<SVGElement>) =>
  {
    if (this.state.picking)
    {
      const position = e.pageX - e.currentTarget.getBoundingClientRect().left;
      const percent = position / this.settings.barLength;
      const newLight = Math.floor(percent * 100);

      const newValue = this.updateSingleAttribute("lightness", newLight);

      this.setState({currentValue: newValue});

      if (this.props.update)
      {
        this.props.update(newValue);
      }
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

  private updateSingleAttribute = (attribute: string, value: number) =>
  {
    const currentAttributes = this.valueToHSL(this.property.value.toString());
    const h = (attribute === "hue") ? value : currentAttributes.h;
    const s = (attribute === "saturation") ? value : currentAttributes.s;
    const l = (attribute === "lightness") ? value : currentAttributes.l;

    return this.hslToValue(h, s, l);
  }

  private hslToValue = (h: number, s: number, l: number) =>
  {
    const response = this.zeroPadAttribute(h) + this.zeroPadAttribute(s) +
      this.zeroPadAttribute(l) ;

    return response;
  }

  private zeroPadAttribute = (attribute: number) =>
  {
    let result = attribute.toString();
    while (result.length < 3)
    {
      result = "0" + result;
    }
    return result;
  }

  // Split value (hhhssslll) into Hue, Saturation and Lightness values
  private valueToHSL = (value: string) =>
  {
    let h = 0;
    let s = 0;
    let l = 0;

    Array.from(value).map(
    (n: string, i: number, array: string[]) =>
    {
      switch(i)
      {
        case 0:
        case 1:
        case 2:
        {
          h = parseInt(h.toString().concat(n), 10);
          break;
        }

        case 3:
        case 4:
        case 5:
        {
          s = parseInt(s.toString().concat(n), 10);
          break;
        }

        case 6:
        case 7:
        case 8:
        {
          l = parseInt(l.toString().concat(n), 10);
          break;
        }
      }
    });

    return {h, s, l};
  }
}
