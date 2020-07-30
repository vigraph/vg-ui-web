# ViGraph Web UI

This is the Web user interface of the ViGraph system, providing a drag-and-drop circuit diagram metaphor for creating ViGraph applications.  It connects to a [ViGraph engine](https://github.com/vigraph/vg-server) which actually runs the application.

ViGraph was created in 2017 by [Paul Clark](https://sandtreader.com), initially to create interactive laser displays for his company [Greenwave Interactive](https://greenwaveinteractive.com).  Tom Nicholls at Paul's other company [Packet Ship](https://www.packetship.com) significantly improved the user interface in 2019/20.  Paul published the whole of ViGraph under AGPLv3 in July 2020.

## What's it for?

Briefly, ViGraph is a platform for creating complex systems by plugging together simple modules, either graphically, or in a simple text language (VG).  It started as a primarily creative platform for audio and laser graphics, but it is expanding its horizons all the time...

It currently has modules for:

* Audio synthesis
* Vector graphics, including laser output
* Bitmap graphics, including LED output
* MIDI
* DMX lighting
* IoT and sensor interfaces
* Maths and physics simulation
* Time series data processing and visualisation

You can find out more about ViGraph (with prettier pictures) at [vigraph.com](https://vigraph.com)

## How to run it

This is a REACT+TypeScript application built with [Create React App](https://create-react-app.dev/) (CRA).  To run it, clone this repository and run "npm start" in the directory:

        $ git clone git@github.com:vigraph/vg-ui-web.git
        $ cd vg-ui-web
        $ npm start

