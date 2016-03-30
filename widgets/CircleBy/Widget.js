import declare from 'dojo/_base/declare';
import domClass from 'dojo/dom-class';
import array from 'dojo/_base/array';
import lang from 'dojo/_base/lang';
import on from 'dojo/on';

import BaseWidget from 'jimu/BaseWidget';

import Graphic from 'esri/Graphic';
import Point from 'esri/geometry/Point';
import Polygon from 'esri/geometry/Polygon';
import GraphicsLayer from 'esri/layers/GraphicsLayer';
import SimpleFillSymbol from 'esri/symbols/SimpleFillSymbol';
import SimpleLineSymbol from 'esri/symbols/SimpleLineSymbol';
import SimpleMarkerSymbol from 'esri/symbols/SimpleMarkerSymbol';
import geometryEngineAsync from 'esri/geometry/geometryEngineAsync';

// To create a widget, you need to derive from BaseWidget.
export default declare([BaseWidget], {
  baseClass: 'circle-by-widget',
  graphicsLayer: undefined,

  postCreate() {
    this.inherited(arguments);

    //create a new graphicslayer where the created buffercircle can be added to
    this.graphicsLayer = new GraphicsLayer();
    this.sceneView.map.add(this.graphicsLayer);
  },

  _btnCircleByClicked() {
    domClass.add(this.btnCircleBy, 'active');
    //handle the sceneview click event only once
    on.once(this.sceneView, 'click', lang.hitch(this, this._mapClicked));
  },

  _mapClicked(evt) {
    var point = evt.mapPoint;
    var bufferDistance = 100;
    var bufferUnits = 'meters';

    //perform a geodesicBuffer
    geometryEngineAsync.geodesicBuffer(point, bufferDistance, bufferUnits)
      .then(lang.hitch(this, function(response) {

        //loop through the points of the buffercircle
        array.forEach(response.rings[0], lang.hitch(this, function(ring) {
          //add each point to the graphicslayer
          var pointGraphic = this.createPointGraphic(ring[0], ring[1], 100);
          this.graphicsLayer.add(pointGraphic);

          //lift the ring into the air so it's visible
          ring[2] = 200;
        }));

        //start the animation based on the points in the buffer
        this.startCircleBy(response.rings[0]);
      }));
  },

  startCircleBy(ringPoints) {
    var index = 0;
    var count = ringPoints.length;

    this.loopThrougRingPoints(ringPoints, index, count);
  },

  loopThrougRingPoints(ringPoints, index, count) {
    //animate to the given point in the buffercircle
    var deferred = this.sceneView.animateTo({
      target: new Point({
        x: ringPoints[index][0],
        y: ringPoints[index][1],
        z: 100,
        spatialReference: 102100
      }),
      heading: ((360 / count) * index),
      tilt: 60,
      zoom: 18
    });

    //update the counter and determine if another animation should be executed
    index++;
    if (index < count) {
      deferred.then(lang.hitch(this,
        this.loopThrougRingPoints, ringPoints, index, count));
    } else {
      domClass.remove(this.btnCircleBy, 'active');
    }
  },

  //create a graphic to add to the graphisclayer
  createPointGraphic(x, y, z) {
    var point = new Point({
      x: x,
      y: y,
      z: z,
      spatialReference: 102100
    });

    var pointGraphic = new Graphic({
      geometry: point,
      symbol: this.createSimpleMarkerSymbol()
    });

    return pointGraphic;
  },

  //create a symbol that can be used by the graphic
  createSimpleMarkerSymbol() {
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
