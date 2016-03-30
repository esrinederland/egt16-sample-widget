define(['dojo/_base/declare', 'dojo/dom-class', 'dojo/_base/array', 'dojo/_base/lang', 'dojo/on', 'jimu/BaseWidget', 'esri/Graphic', 'esri/geometry/Point', 'esri/geometry/Polygon', 'esri/layers/GraphicsLayer', 'esri/symbols/SimpleFillSymbol', 'esri/symbols/SimpleLineSymbol', 'esri/symbols/SimpleMarkerSymbol', 'esri/geometry/geometryEngineAsync'], function (declare, domClass, array, lang, on, BaseWidget, Graphic, Point, Polygon, GraphicsLayer, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, geometryEngineAsync) {
  return declare([BaseWidget], {
    baseClass: 'circle-by-widget',
    graphicsLayer: undefined,

    postCreate: function postCreate() {
      this.inherited(arguments);

      //create a new graphicslayer where the created buffercircle can be added to
      this.graphicsLayer = new GraphicsLayer();
      this.sceneView.map.add(this.graphicsLayer);
    },
    _btnCircleByClicked: function _btnCircleByClicked() {
      domClass.add(this.btnCircleBy, 'active');
      //handle the sceneview click event only once
      on.once(this.sceneView, 'click', lang.hitch(this, this._mapClicked));
    },
    _mapClicked: function _mapClicked(evt) {
      var point = evt.mapPoint;
      var bufferDistance = 100;
      var bufferUnits = 'meters';

      //perform a geodesicBuffer
      geometryEngineAsync.geodesicBuffer(point, bufferDistance, bufferUnits).then(lang.hitch(this, function (response) {

        //loop through the points of the buffercircle
        array.forEach(response.rings[0], lang.hitch(this, function (ring) {
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
    startCircleBy: function startCircleBy(ringPoints) {
      var index = 0;
      var count = ringPoints.length;

      this.loopThrougRingPoints(ringPoints, index, count);
    },
    loopThrougRingPoints: function loopThrougRingPoints(ringPoints, index, count) {
      //animate to the given point in the buffercircle
      var deferred = this.sceneView.animateTo({
        target: new Point({
          x: ringPoints[index][0],
          y: ringPoints[index][1],
          z: 100,
          spatialReference: 102100
        }),
        heading: 360 / count * index,
        tilt: 60,
        zoom: 18
      });

      //update the counter and determine if another animation should be executed
      index++;
      if (index < count) {
        deferred.then(lang.hitch(this, this.loopThrougRingPoints, ringPoints, index, count));
      } else {
        domClass.remove(this.btnCircleBy, 'active');
      }
    },
    createPointGraphic: function createPointGraphic(x, y, z) {
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
    createSimpleMarkerSymbol: function createSimpleMarkerSymbol() {
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
});
