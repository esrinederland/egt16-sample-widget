import declare from 'dojo/_base/declare';
import domClass from 'dojo/dom-class';
import array from 'dojo/_base/array';
import lang from 'dojo/_base/lang';
import on from 'dojo/on';

import BaseWidget from 'jimu/BaseWidget';

import Camera from 'esri/Camera';
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

  postCreate() {
    this.inherited(arguments);

    // create a new graphicslayer where the created buffercircle can be added to
    this.graphicsLayer = new GraphicsLayer();
    this.sceneView.map.add(this.graphicsLayer);
  },

  btnCircleByClicked() {
    // clear previous graphics on the map
    this.graphicsLayer.clear();

    // add active cssclass to button
    domClass.add(this.btnCircleBy, 'active');

    // handle the sceneview click event only once
    on.once(this.sceneView, 'click', lang.hitch(this, this.mapClicked));
  },

  mapClicked(evt) {
    var point = evt.mapPoint;
    var bufferDistance = 50;
    var bufferUnits = 'meters';

    // perform a geodesicBuffer
    geometryEngineAsync.geodesicBuffer(point, bufferDistance, bufferUnits)
      .then(lang.hitch(this, this.addRingToMap))
      .then(lang.hitch(this, this.startCircleBy));
  },

  addRingToMap(response) {
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

  startCircleBy(ringPoints) {
    var ring = {
      index: 0,
      count: ringPoints.length,
      ringPoints: ringPoints
    };
    //this.graphicsLayer.clear();
    // start the animation based on the points in the buffer
    this.loopThrougRingPoints(ring);
  },

  loopThrougRingPoints(ring) {
    // animate to the given point in the buffercircle
    // update the counter and determine if another animation should be executed
    ring.index++;
    if (ring.index < ring.count) {
      // create a point on which the view will be centered
      var point = new Point({
        x: ring.ringPoints[ring.index][0],
        y: ring.ringPoints[ring.index][1],
        z: 40,
        spatialReference: {
          wkid: 102100
        }
      });

      // create viewpoint info that can be used by the SceneView
      var viewPointInfo = {
        heading: ((360 / ring.count) * ring.index),
        tilt: 70,
        scale: 1250,
        target: point,
      }

      this.navigateToViewPoint(viewPointInfo);

      // wait a short time before going to the next point
      setTimeout(lang.hitch(this, this.loopThrougRingPoints, ring), 30);
    } else {
      domClass.remove(this.btnCircleBy, 'active');
    }
  },

  navigateToViewPoint(viewPointInfo) {
    //create a new viewpoint based on the viewpoint info
    var viewPoint = this.sceneView.createViewpoint(viewPointInfo);

    //set the new viewpoint
    this.sceneView.viewpoint = viewPoint;
  },

  // create a graphic to add to the graphisclayer
  createPointGraphic(coordinates) {
    var point = new Point(coordinates);

    var pointGraphic = new Graphic({
      geometry: point,
      symbol: this.createSimpleMarkerSymbol()
    });

    return pointGraphic;
  },

  // create a symbol that can be used by the graphic
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
