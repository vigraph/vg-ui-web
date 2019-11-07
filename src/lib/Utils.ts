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

  // Calculate text bounding box
  public textBoundingSize(text: string, fontSize: number)
  {
    const svgEle = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const textEle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    svgEle.appendChild(textEle);
    document.body.appendChild(svgEle);
    textEle.textContent = text;
    textEle.setAttribute("font-size", fontSize.toString());
    const boundingRect = textEle.getBoundingClientRect();
    document.body.removeChild(svgEle);

    return {height: boundingRect.height, width: boundingRect.width};
  }

  // Calculate text wrapping and return text split into array of wrapped lines
  public wrapText(text: string, lineWidth: number, fontSize: number)
  {
    const words = text.split(' ');

    const svgEle = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const textEle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    svgEle.appendChild(textEle);
    document.body.appendChild(svgEle);
    textEle.setAttribute("font-size", fontSize.toString());

    const wordsWithComputedWidth = words.map(word =>
    {
      textEle.textContent = word;
      return { word, width: textEle.getComputedTextLength() }
    });

    textEle.textContent = '\u00A0'; // Unicode space
    const spaceWidth = textEle.getComputedTextLength();

    document.body.removeChild(svgEle);

    const wordsByLines = wordsWithComputedWidth.reduce(
      (result: Array<{words: string[], width: number}>, { word, width}) =>
      {
        const words: string[] = [];
        const lastLine = result[result.length - 1] || { words, width: 0 };

        if (lastLine.words.length === 0)
        {
          // First word on line
          const newLine = { words: [word], width };
          result.push(newLine);
        }
        else if (lastLine.width + width + (lastLine.words.length * spaceWidth) <
          lineWidth)
        {
          // Word can be added to an existing line
          lastLine.words.push(word);
          lastLine.width += width;
        }
        else
        {
          // Word too long to fit on existing line
          const newLine = { words: [word], width };
          result.push(newLine);
        }

        return result;
      }, []);

    const linesArray = wordsByLines.map(line => line.words.join(' '));

    return linesArray
  }

  // Snap value to closest increment
  // Return value is rounded to the same accuracy as the increment
  public snapValueToIncrement = (value: number, increment: number) =>
  {
    const split = increment.toString().split(".");
    const decimalPlaces = split[1] ? split[1].length : 0;
    const multiplier = (Math.pow(10, decimalPlaces));

    const iValue = Math.round(Math.abs(value) * multiplier);
    const iIncrement = Math.round(increment * multiplier);

    const mod = iValue % iIncrement;
    const diff = iValue - mod;

    // Snap to the closest increment
    const snap = (mod > iIncrement/2) ? iIncrement : 0;
    const nValue = diff + snap;

    const newValue = (nValue / multiplier) * Math.sign(value);

    return newValue;
  }

  // Colour Functions (all input/output values [0..1] or hex #rrggbb)

  public hslToRGB = (input: {h: number, s: number, l: number}) =>
  {
    const hueToRGB = (t1: number, t2: number, hue: number) =>
    {
      if (hue < 0)
      {
        hue += 6;
      }

      if (hue >= 6)
      {
        hue -= 6;
      }

      if (hue < 1)
      {
        return (t2 - t1) * hue + t1;
      }
      else if(hue < 3)
      {
        return t2;
      }
      else if(hue < 4)
      {
        return (t2 - t1) * (4 - hue) + t1;
      }
      else
      {
        return t1;
      }
    }

    let test2;
    let h = input.h * 360;
    const s = input.s;
    const l = input.l;

    h = h / 60;

    if ( l <= 0.5 )
    {
      test2 = l * (s + 1);
    }
    else
    {
      test2 = l + s - (l * s);
    }

    const test1 = l * 2 - test2;

    return {r : hueToRGB(test1, test2, h + 2), g : hueToRGB(test1, test2, h),
      b : hueToRGB(test1, test2, h - 2)};
  }

  public rgbToHSL = (input: {r: number, g: number, b: number}) =>
  {
    const rgb = [input.r, input.g, input.b];

    let min = rgb[0];
    let max = rgb[0];
    let maxColour = 0;

    let h;
    let l;
    let s;

    for (let i = 0; i < rgb.length - 1; i++)
    {
      if (rgb[i + 1] <= min)
      {
        min = rgb[i + 1];
      }

      if (rgb[i + 1] >= max)
      {
        max = rgb[i + 1];
        maxColour = i + 1;
      }
    }

    switch (maxColour)
    {
      case (0):
        h = (rgb[1] - rgb[2]) / (max - min);
        break;
      case (1):
        h = 2 + (rgb[2] - rgb[0]) / (max - min);
        break;
      case (2):
        h = 4 + (rgb[0] - rgb[1]) / (max - min);
        break;
    }

    if (typeof h === "undefined" || isNaN(h))
    {
      h = 0;
    }

    h = h * 60;
    if (h < 0)
    {
      h = h + 360;
    }

    l = (min + max) / 2;

    if (min === max)
    {
      s = 0;
    }
    else
    {
      if (l < 0.5)
      {
        s = (max - min) / (max + min);
      }
      else
      {
        s = (max - min) / (2 - max - min);
      }
    }

    h = h / 360;
    return {h, s, l};
  }

  public rgbToHex = (rgb: {r: number, g: number, b: number}) =>
  {
    const toHex = (colour: number) =>
    {
      let hex = Math.round(colour * 255).toString(16);
      if (hex.length < 2)
      {
        hex = "0" + hex;
      }
      return hex;
    }

    return "#" + toHex(rgb.r) + toHex(rgb.g) + toHex(rgb.b);
  }

  public hexToRGB = (hex: string) =>
  {
    hex = hex.replace('#','');

    // Convert [#]rgb to [#]rrggbb
    if (hex.length === 3)
    {
      hex = hex.substring(0,1) + hex.substring(0,1) + hex.substring(1,2) +
        hex.substring(1,2) + hex.substring(2,3) + hex.substring(2,3);
    }

    const r = parseInt(hex.substring(0,2), 16) / 255;
    const g = parseInt(hex.substring(2,4), 16) / 255;
    const b = parseInt(hex.substring(4,6), 16) / 255;

    return {r, g, b};
  }
}

export const vgUtils = new Utils();
