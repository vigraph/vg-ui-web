import * as React from 'react';
import * as Model from '../model';

import * as vgTypes from '../lib/Types';
import { vgConfig } from '../lib/Config';
import { vgUtils } from '../lib/Utils';

interface IProps
{
  property: Model.Property;
  startUpdate: () => void;
  update: (value: string) => void;
  endUpdate: () => void;
  position: {x: number, y: number};
  disabled: boolean;
  settingsType: string;
}

interface IState
{
  currentText: string;
}

export default class TextDisplay extends React.Component<IProps, IState>
{
  private property: Model.Property;

  private settings: vgTypes.ITextDisplaySettings;

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    const textDisplaySettings = vgConfig.Controls.textDisplay;

    this.settings = textDisplaySettings[this.props.settingsType] ?
      textDisplaySettings[this.props.settingsType] : textDisplaySettings.default;

    this.state =
    {
      currentText: this.property.value.toString()
    };

    if (this.state.currentText === "")
    {
      vgUtils.log("TextDisplay Component: Setting to default text " +
        JSON.stringify(this.settings.defaultText));
      this.props.update(this.settings.defaultText);
    }
  }

  public render()
  {
    const fontSize = this.settings.fontSize;

    const linesArray = vgUtils.wrapText(this.state.currentText,
        this.settings.width, fontSize);

    const height = linesArray.length * (vgUtils.textBoundingSize(linesArray[0],
      fontSize).height + 2);

    return(
        <svg id="text-display" className={this.props.settingsType}>
          <svg id="text-display-wrapper"
            x={0} y={0}
            width={this.settings.width} height={height}>
            <text id="text-display-text" className="label"
              fontSize={fontSize} x={0} y={0}>
            {linesArray.map((word: string, index: number) =>
            {
              return <tspan key={index} x={0}
                dy={index*(fontSize+2)}>{word}</tspan>
            })}
            </text>
          </svg>
        </svg>
    );
  }
}
