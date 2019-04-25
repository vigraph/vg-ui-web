// ViGraph Logger
// Copyright (c) Paul Clark 2019

class Logger
{

  public log(str: string)
  {
    if (window.console)
    {
      window.console.log(str);
    }
  }

}

export const vgLogger = new Logger();
