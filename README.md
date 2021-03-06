# ViGraph Web UI

This is the Web user interface of the [ViGraph](https://vigraph.com) system, providing a drag-and-drop circuit diagram metaphor for creating ViGraph applications.  It connects to a [ViGraph engine](https://github.com/vigraph/vg-server) which actually runs the application.

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

This is a React+TypeScript Web app built with [Create React App](https://create-react-app.dev/) (CRA).  To run it, clone this repository and run `npm install` and `npm start` in the directory:

        $ git clone git@github.com:vigraph/vg-ui-web.git
        $ cd vg-ui-web
        $ npm install
        $ npm start

You'll need npm installed, of course (`sudo apt install npm`) but it will take care of the rest!

By default the Web app will connect to http://localhost:33381 which is the default REST interface port provided by the local ViGraph engine server on the same machine.  If you want to connect to another server, you can change the URL in `src/lib/json/GraphConfig.json`.

## Contributions

Yes please!

If it's a bug-fix, test or tidy, please just go ahead and send a PR.  If it's anything major, please discuss it with me first...

I ask all contributors to sign a standard, FSF-approved [Contributor License Agreement](http://contributoragreements.org/) to make the project easier to manage.  You can sign it when you generate a PR, or in advance [here](https://cla-assistant.io/vigraph/vg-server).  You only have to do this once for all of ViGraph and ObTools.

Thanks!
