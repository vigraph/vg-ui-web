// ViGraph Configuration Class
// Copyright (c) Paul Clark 2019

import * as vgTypes from '../lib/Types';

class Config
{
  public Graph: {[key: string]: any};
  public Properties: vgTypes.IPropertiesConfig;
  public Controls: any;

  constructor()
  {
    this.Graph = require('./json/GraphConfig.json');
    this.Properties = require('./json/PropertiesConfig.json');
    this.Controls = require('./json/ControlsConfig.json');
  }
}

export const vgConfig = new Config();
