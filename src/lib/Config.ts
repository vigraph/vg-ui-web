// ViGraph Configuration Class
// Copyright (c) Paul Clark 2019

import * as vgTypes from '../lib/Types';
import { vgUtils } from '../lib/Utils';

class Config
{
  public Graph: {[key: string]: any};
  public Controls: any;
  public Strings: vgTypes.ILanguageStrings;

  constructor()
  {
    this.Graph = require('./json/GraphConfig.json');
    this.Controls = require('./json/ControlsConfig.json');

    this.Strings = require('./languages/en.json');

    try
    {
      const translated = require('./languages/'+this.Graph.language+'.json');
      this.Strings = {...this.Strings, ...translated};
    }
    catch (ex)
    {
      vgUtils.log("Multi Language Error: Could not find translated strings " +
        "for lanugage - " + this.Graph.language);
    }
  }
}

export const vgConfig = new Config();
