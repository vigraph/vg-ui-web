import * as React from 'react';
import * as Model from '../model';

import * as vgTypes from '../lib/Types';
import { vgConfig } from '../lib/Config';
import { vgUtils } from '../lib/Utils';
import { vgData } from '../data/Data';

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
  private settings: vgTypes.ITextDisplaySettings;

  private updateInterval: number | null;

  constructor(props: IProps)
  {
    super(props);

    this.updateInterval = null;

    const textDisplaySettings = vgConfig.Controls.textDisplay;

    this.settings = textDisplaySettings[this.props.settingsType] ?
      textDisplaySettings[this.props.settingsType] : textDisplaySettings.default;

    this.state =
    {
      currentText: this.props.property.value
    };

    if (this.state.currentText === "")
    {
      vgUtils.log("TextDisplay Component: Setting to default text " +
        JSON.stringify(this.settings.defaultText));
      this.props.update(this.settings.defaultText);
    }
  }

  public componentDidMount()
  {
    if (this.props.property.value === undefined)
    {
      this.updateTextValue();
      this.updateInterval = window.setInterval(() =>
      {
        this.updateTextValue();
      }, vgConfig.Graph.logUpdateTime*1000)
    }
  }

  public componentWillUnmount()
  {
    if (this.updateInterval)
    {
      window.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  public render()
  {
    const fontSize = this.settings.fontSize;

    const text = (this.state.currentText !== undefined ?
      this.state.currentText.toString() : "");

    const linesArray = vgUtils.wrapText(text, this.settings.width, fontSize);

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
                dy={(index?1:0)*(fontSize+2)}>{word}</tspan>
            })}
            </text>
          </svg>
        </svg>
    );
  }

  private updateTextValue = () =>
  {
    if (this.props.property.value === undefined)
    {
      const node = this.props.property.getParentNode();
      if (node)
      {
        vgData.getPropertyValue(node.path, this.props.property.id,
          (value: any) => {this.setState({currentText: value})});
      }
    }
  }
}
