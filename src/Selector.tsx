import * as React from 'react';
import * as Model from './model';

import * as vgTypes from './lib/Types';

interface IProps
{
  property: Model.Property;
  startUpdate: () => void;
  update: (value: number) => void;
  endUpdate: () => void;
  position: {x: number, y:number};
  disabled: boolean;
}

interface IState
{
  currentValue: number;
  selecting: boolean;
}

export default class Selector extends React.Component<IProps, IState>
{
  // Reset state from selector when not selecting - allows movement not by
  // selecting (e.g. undo/redo) to work
  public static getDerivedStateFromProps(props: IProps, state: any)
  {
    return state.sliding ? null :
      { currentValue: props.property.value };
  }

  private property: Model.Property;

  private settings: vgTypes.ISelectorSettings;

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    const selectorSettings = require('./json/ControlSettings.json').selector;

    this.settings = selectorSettings[this.property.subType] ?
      selectorSettings[this.property.subType] : selectorSettings.default;

    this.state =
    {
      currentValue: this.property.value,
      selecting: false
    };
  }

  public render()
  {
    const settings = this.settings;
    const availablePos = this.props.property.available
    const currentPos = availablePos.indexOf(this.state.currentValue);

    const positionSize = settings.length / availablePos.length;

    return(
        <svg id="selector" className={`${this.property.subType}
          ${this.state.selecting ? "selecting" : ""}`}>

          <rect className="selector-background" width={settings.length}
            height={settings.thickness}
            transform={`rotate(${settings.horizontal ? "0" : "90"}, ${0},
              ${0}) translate(5, ${settings.horizontal ? "0" :
               -settings.thickness})`}/>

          {this.props.property.available.map((value: any, index: number) =>
            {
              return <svg id={value} key={index}
                  onMouseDown={this.handleMouseDown}
                  onMouseEnter={this.handleMouseEnter}>
                <rect className={`selector-position ${value.toString()}
                  ${value === this.state.currentValue ? "selected" : ""}`}
                  width={positionSize} height={settings.thickness}
                  x={(positionSize * index)}
                  transform={`rotate(${settings.horizontal ? "0" : "90"}, ${0},
                  ${0}) translate(5, ${settings.horizontal ? "0" :
                  -settings.thickness})`}/>
                <text className="label selector-label"
                  x={`${settings.horizontal ? (positionSize * index) + 5 :
                    settings.thickness + 10}`}
                  y={`${settings.horizontal ? settings.thickness + 10 :
                    (positionSize * index) + 15}`}>
                  {value}
                </text>
              </svg>
            })
          }

          <rect className="selector-dial"
            x={(positionSize * currentPos) + (positionSize / 2)}
            width={1} height={settings.thickness}
            transform={`rotate(${settings.horizontal ? "0" : "90"}, ${0},
              ${0}) translate(5, ${settings.horizontal ? "0" :
               -settings.thickness})`}/>

        </svg>
    );
  }

  private handleMouseDown = (e: React.MouseEvent<SVGElement>) =>
  {
    e.stopPropagation();
    window.addEventListener('mouseup', this.handleMouseUp);

    this.setState({selecting: true});

    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }

    this.selectValue(e.currentTarget.id);
  }

  private handleMouseEnter = (e: React.MouseEvent<SVGElement>) =>
  {
    if (this.state.selecting)
    {
      this.selectValue(e.currentTarget.id);
    }
  }

  private selectValue = (value: any) =>
  {
    if (this.state.currentValue !== value &&
      this.props.property.available.indexOf(value) > -1)
    {
      this.setState({currentValue: value});
      if (this.props.update)
      {
        this.props.update(value);
      }
    }
  }

  private handleMouseUp = (e: MouseEvent) =>
  {
    window.removeEventListener('mouseup', this.handleMouseUp);

    this.setState({selecting: false});

    if (this.props.endUpdate)
    {
      this.props.endUpdate();
    }
  }
}
