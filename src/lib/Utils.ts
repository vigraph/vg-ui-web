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

  // Calculate text wrapping and return text split into array of wrapped lines
  public wrapText(text: string, lineWidth: number, fontSize: number)
  {
    const words = text.split(' ');

    const svgEle = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const textEle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    svgEle.appendChild(textEle);
    document.body.appendChild(svgEle);

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
}

export const vgUtils = new Utils();
