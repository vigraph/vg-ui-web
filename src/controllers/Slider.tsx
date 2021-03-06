import * as React from 'react';
import * as Model from '../model';

import { vgConfig } from '../lib/Config';
import { vgUtils } from '../lib/Utils';
import * as vgTypes from '../lib/Types';

interface IProps
{
  property: Model.Property;
  startUpdate: () => void;
  update: (value: number) => void;
  endUpdate: () => void;
  position: {x: number, y:number};
  disabled: boolean;
  settingsType: string;
}

interface IState
{
  currentValue: number;
  sliding: boolean;
}

export default class Slider extends React.Component<IProps, IState>
{
  // Reset state from slider when not sliding - allows movement not by
  // sliding (e.g. undo/redo) to work
  public static getDerivedStateFromProps(props: IProps, state: any)
  {
    return state.sliding ? null :
      { currentValue: props.property.value };
  }

  private property: Model.Property;

  private pointerStart: {x: number, y: number};

  private settings: vgTypes.ISliderSettings;

  private sliderRef: SVGSVGElement | null;

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    const sliderSettings = vgConfig.Controls.slider;

    this.settings = sliderSettings[this.props.settingsType] ?
      sliderSettings[this.props.settingsType] : sliderSettings.default;
    this.sliderRef = null;

    this.state =
    {
      currentValue: this.property.value,
      sliding: false
    };

    this.pointerStart = {x: 0, y: 0};
  }

  public render()
  {
    const settings = this.settings;

    if (settings.logControl)
    {
      if (this.property.range.min === undefined || this.property.range.min <= 0)
      {
        vgUtils.log("Knob Error - Logarithmic control minimum range");
      }

      if (this.state.currentValue === 0)
      {
        vgUtils.log("Slider Error - Logarithmic control with current value 0");
      }
    }

    const propRange = Object.assign({}, this.property.range);
    propRange.min = (propRange.min !== undefined ? propRange.min : 0);
    propRange.max = (propRange.max !== undefined ? propRange.max : 1);

    const rangeMin = settings.logControl ? Math.log10(propRange.min) :
      propRange.min;
    const rangeMax = settings.logControl ? Math.log10(propRange.max) :
      propRange.max;
    let currentValue = settings.logControl ?
      Math.log10(this.state.currentValue) : this.state.currentValue;

    currentValue = Math.min(currentValue, rangeMax);
    currentValue = Math.max(currentValue, rangeMin);

    if (isNaN(currentValue))
    {
      currentValue = rangeMin;
    }

    const currentPos = ((currentValue - rangeMin) / (rangeMax - rangeMin)) *
      settings.length;

    return(
        <svg id="slider" className={this.props.settingsType}
          ref={(ref) => {this.sliderRef = ref}}
          onPointerDown={this.handlePointerDown}>

          <rect className="slider-background"
            width={settings.length} height={settings.thickness}
            transform={`scale(${this.state.sliding ? settings.slideScale :
              "1"}) rotate(${settings.horizontal ? "0" : "270"}, ${0}, ${0})` +
              `translate(${settings.horizontal ? "0" : -settings.length},0)`}/>

          <rect className="slider-value"
            width={currentPos} height={settings.thickness}
            transform={`scale(${this.state.sliding ? settings.slideScale :
              "1"}) rotate(${settings.horizontal ? "0" : "270"}, ${0}, ${0})` +
              `translate(${settings.horizontal ? "0" : -settings.length},0)`}/>

          <rect className="slider-dial"
            x={currentPos}
            width={settings.dialThickness} height={settings.thickness}
            transform={`scale(${this.state.sliding ? settings.slideScale :
              "1"}) rotate(${settings.horizontal ? "0" : "270"}, ${0}, ${0})` +
              `translate(${settings.horizontal ? "0" : -settings.length},0)`}/>

        </svg>
    );
  }

  private handlePointerDown = (e: React.PointerEvent<SVGElement>) =>
  {
    e.stopPropagation();
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointermove', this.handlePointerMove);

    const currentPosition = vgUtils.windowToSVGPosition(
      {x: e.pageX, y: e.pageY}, this.sliderRef);

    this.pointerStart = currentPosition;

    this.setState({sliding: true});

    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }

    const settings = this.settings;

    // Move current value to click position
    if (settings.slideScale === 1 && settings.clickMove)
    {
      const propRange = Object.assign({}, this.property.range);
      propRange.min = (propRange.min !== undefined ? propRange.min : 0);
      propRange.max = (propRange.max !== undefined ? propRange.max : 1);

      const rangeMin = settings.logControl ? Math.log10(propRange.min) :
        propRange.min;
      const rangeMax = settings.logControl ? Math.log10(propRange.max) :
        propRange.max;

      const newDistance = settings.horizontal ? currentPosition.x :
        settings.length - currentPosition.y;
      const newPos = this.limitPosition(newDistance);
      const newPercent = newPos / settings.length;
      let newValue = (newPercent * (rangeMax -
        rangeMin)) + rangeMin;

      if (settings.logControl)
      {
        newValue = Math.pow(10, newValue);
      }

      this.setState({currentValue: newValue});
      if (this.props.update)
      {
        this.props.update(newValue);
      }
    }
  }

  private handlePointerUp = (e: PointerEvent) =>
  {
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointermove', this.handlePointerMove);

    this.setState({sliding: false});

    if (this.props.endUpdate)
    {
      this.props.endUpdate();
    }
  }

  private handlePointerMove = (e: PointerEvent) =>
  {
    const currentPosition = vgUtils.windowToSVGPosition(
      {x: e.pageX, y: e.pageY}, this.sliderRef);

    const diff = this.settings.horizontal ? currentPosition.x -
      this.pointerStart.x : this.pointerStart.y - currentPosition.y;

    const settings = this.settings;

    const propRange = Object.assign({}, this.property.range);
    propRange.min = (propRange.min !== undefined ? propRange.min : 0);
    propRange.max = (propRange.max !== undefined ? propRange.max : 1);

    const rangeMin = settings.logControl ? Math.log10(propRange.min) :
      propRange.min;
    const rangeMax = settings.logControl ? Math.log10(propRange.max) :
      propRange.max;
    const currentValue = settings.logControl ?
      Math.log10(this.state.currentValue) : this.state.currentValue;

    let newPos = (((currentValue - rangeMin ) / (rangeMax - rangeMin)) *
      settings.length) + (diff / settings.slideScale);

    newPos = this.limitPosition(newPos);

    const newPercent = newPos / settings.length;
    let newValue = (newPercent * (rangeMax - rangeMin)) + rangeMin;

    if (settings.logControl)
    {
      newValue = Math.pow(10, newValue);
    }

    this.setState({currentValue: newValue});

    this.pointerStart = currentPosition;

    if (this.props.update)
    {
      this.props.update(newValue);
    }
  }

  // Limit the position given to between 0 and the slider maximum (length)
  private limitPosition = (position: number) =>
  {
    if (position > this.settings.length)
    {
      position = this.settings.length;
    }
    else if (position < 0)
    {
      position = 0;
    }

    return position
  }
}
