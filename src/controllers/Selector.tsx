import * as React from 'react';
import * as Model from '../model';

import { vgConfig } from '../lib/Config';
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
  currentValue: string;
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

  private choices: string[];

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    const selectorSettings = vgConfig.Controls.selector;

    this.settings = selectorSettings[this.props.settingsType] ?
      selectorSettings[this.props.settingsType] : selectorSettings.default;

    const choiceData = vgConfig.Controls.choice_data;

    this.choices = choiceData[this.property.valueType] ?
      choiceData[this.property.valueType] : [];

    this.state =
    {
      currentValue: this.property.value,
      selecting: false
    };
  }

  public render()
  {
    const settings = this.settings;
    const currentPos = this.choices.indexOf(this.state.currentValue);

    const positionSize = settings.length / this.choices.length;
    const fontSize = vgConfig.Graph.fontSize.selectorLabel;

    return(
        <svg id="selector" className={`${this.props.settingsType}
          ${this.props.property.valueType}
          ${this.state.selecting ? "selecting" : ""}`}>

          {this.choices.map((value: any, index: number) =>
            {
              return <svg id={value} className={"selector-choice"} key={index}
                  onPointerDown={this.handlePointerDown}
                  onPointerEnter={this.handlePointerEnter}>
                <rect className={`selector-position ${value.toString()}
                  ${value === this.state.currentValue ? "selected" : ""}`}
                  width={positionSize} height={settings.thickness}
                  x={(positionSize * index)}
                  transform={`rotate(${settings.horizontal ? "0" : "90"}, ${0},
                  ${0}) translate(5, ${settings.horizontal ? "0" :
                  -settings.thickness})`}/>
                <text className="label selector-label"
                  fontSize={fontSize}
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

  private handlePointerDown = (e: React.PointerEvent<SVGElement>) =>
  {
    e.stopPropagation();
    window.addEventListener('pointerup', this.handlePointerUp);

    this.setState({selecting: true});

    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }

    this.selectValue(e.currentTarget.id);
  }

  private handlePointerEnter = (e: React.PointerEvent<SVGElement>) =>
  {
    if (this.state.selecting)
    {
      this.selectValue(e.currentTarget.id);
    }
  }

  private selectValue = (value: any) =>
  {
    if (this.state.currentValue !== value && this.choices.indexOf(value) > -1)
    {
      this.setState({currentValue: value});
      if (this.props.update)
      {
        this.props.update(value);
      }
    }
  }

  private handlePointerUp = (e: PointerEvent) =>
  {
    window.removeEventListener('pointerup', this.handlePointerUp);

    this.setState({selecting: false});

    if (this.props.endUpdate)
    {
      this.props.endUpdate();
    }
  }
}
