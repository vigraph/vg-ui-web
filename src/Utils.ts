// ViGraph Utility Class - helper and utility functions
// Copyright (c) Paul Clark 2019

class Utils
{

  constructor()
  {
    // Nothing to construct
  }

  public log(str: string)
  {
    if (window.console)
    {
      window.console.log(str);
    }
  }

  // Returns window position if SVG position not available
  public windowToSVGPosition(windowPos: {x: number, y: number},
    svgElement: SVGSVGElement | null): {x: number, y: number}
  {
    let svgPosition = windowPos;

    if (svgElement)
    {
      const pt = svgElement.createSVGPoint();
      pt.x = windowPos.x;
      pt.y = windowPos.y;
      const ctm = svgElement.getScreenCTM();
      if (ctm)
      {
        const svgPT = pt.matrixTransform(ctm.inverse());
        svgPosition = {x: svgPT.x, y: svgPT.y};
      }
    }

    return svgPosition;
  }
}

export const vgUtils = new Utils();
