import * as React from 'react';
import * as Model from './model';

import * as vgType from './Types';

import { vgUtils } from './Utils';

interface IProps
{
  property: Model.Property;
  startUpdate: () => void;
  update: (value: string) => void;
  endUpdate: () => void;
  position: {x: number, y: number};
}

interface IState
{
  currentValue: number;
}

export default class TextDisplay extends React.Component<IProps, IState>
{
  private property: Model.Property;

  private settings: vgType.ITextDisplaySettings;

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    const textDisplaySettings =
      require('./json/ControlSettings.json').textDisplay;

    this.settings = textDisplaySettings[this.property.subType] ?
      textDisplaySettings[this.property.subType] : textDisplaySettings.default;

    this.state =
    {
      currentValue: this.property.value
    };
  }

  public render()
  {
    return(
        <svg id="text-display" className={this.property.subType}>
          <text id="text-display-text" className="label"
            x={20} y={20}
            width={this.settings.width} height={this.settings.height}>
          {this.state.currentValue}
          </text>
        </svg>
    );
  }
}
