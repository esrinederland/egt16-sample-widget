import declare from 'dojo/_base/declare';
import domClass from 'dojo/dom-class';
import array from 'dojo/_base/array';
import lang from 'dojo/_base/lang';
import on from 'dojo/on';

import BaseWidget from 'jimu/BaseWidget';

import Graphic from 'esri/Graphic';
import Point from 'esri/geometry/Point';
import GraphicsLayer from 'esri/layers/GraphicsLayer';
import SimpleLineSymbol from 'esri/symbols/SimpleLineSymbol';
import SimpleMarkerSymbol from 'esri/symbols/SimpleMarkerSymbol';
import geometryEngineAsync from 'esri/geometry/geometryEngineAsync';

// To create a widget, you need to derive from BaseWidget.
export default declare([BaseWidget], {
  baseClass: 'circle-by-widget',
  graphicsLayer: undefined,

  postCreate () {
    this.inherited(arguments);

    // create a new graphicslayer where the created buffercircle can be added to
    this.graphicsLayer = new GraphicsLayer();
    this.sceneView.map.add(this.graphicsLayer);
  },

  btnCircleByClicked () {
    // clear previous graphics on the map
    this.graphicsLayer.clear();

    // add active cssclass to button
    domClass.add(this.btnCircleBy, 'active');

    // handle the sceneview click event only once
    on.once(this.sceneView, 'click', lang.hitch(this, this.mapClicked));
  },

  mapClicked (evt) {
    var point = evt.mapPoint;
    var bufferDistance = 50;
    var bufferUnits = 'meters';

    // perform a geodesicBuffer
    geometryEngineAsync.geodesicBuffer(point, bufferDistance, bufferUnits)
      .then(lang.hitch(this, this.addRingToMap))
      .then(lang.hitch(this, this.startCircleBy));
  },

  addRingToMap (response) {
    // loop through the points of the buffercircle
    array.forEach(response.rings[0], lang.hitch(this, function (ring) {
      // add each point to the graphicslayer
      var coordinates = {
        x: ring[0],
        y: ring[1],
        z: 40,
        spatialReference: 102100
      };
      var pointGraphic = this.createPointGraphic(coordinates);
      this.graphicsLayer.add(pointGraphic);
    }));

    return response.rings[0];
  },

  startCircleBy (ringPoints) {
    var params = {
      index: 0,
      count: ringPoints.length,
      ringPoints: ringPoints
    };

    // start the animation based on the points in the buffer
    this.loopThrougRingPoints(params);
  },

  loopThrougRingPoints (params) {
    // animate to the given point in the buffercircle
    // update the counter and determine if another animation should be executed
    params.index++;
    if (params.index < params.count) {
      var deferred = this.sceneView.animateTo({
        target: new Point({
          x: params.ringPoints[params.index][0],
          y: params.ringPoints[params.index][1],
          z: 40,
          spatialReference: 102100
        }),
        heading: ((360 / params.count) * params.index),
        tilt: 70,
        zoom: 19
      });

      deferred.then(lang.hitch(this, this.loopThrougRingPoints, params));
    } else {
      domClass.remove(this.btnCircleBy, 'active');
    }
  },

  // create a graphic to add to the graphisclayer
  createPointGraphic (coordinates) {
    var point = new Point(coordinates);

    var pointGraphic = new Graphic({
      geometry: point,
      symbol: this.createSimpleMarkerSymbol()
    });

    return pointGraphic;
  },

  // create a symbol that can be used by the graphic
  createSimpleMarkerSymbol () {
    var markerSymbol = new SimpleMarkerSymbol({
      color: [226, 119, 40],

      outline: new SimpleLineSymbol({
        color: [255, 255, 255],
        width: 2
      })
    });

    return markerSymbol;
  }
});
