// ViGraph Icons Class
// Copyright (c) Paul Clark 2020

const reqMenuSvgs = require.context('!@svgr/webpack!./menu', true, /\.svg$/)
const reqAppSvgs = require.context('!@svgr/webpack!./app', false, /\.svg$/)

class Icons
{
  public Menu: {[key: string]: any};
  public App: {[key: string]: any};

  constructor()
  {
    this.Menu = {};
    reqMenuSvgs.keys().forEach((path: string) =>
    {
      const key = path.substring(path.lastIndexOf('/') + 1,
        path.lastIndexOf('.')).replace("_","/");
      window.console.log("key from path - " + key + " " + path);
      this.Menu[key] = reqMenuSvgs(path).default;
    });

    this.App = {};
    reqAppSvgs.keys().forEach((path: string) =>
    {
      const key = path.substring(path.lastIndexOf('/') + 1,
        path.lastIndexOf('.'));
      this.App[key] = reqAppSvgs(path).default;
    });
  }
}

export const vgIcons = new Icons();
