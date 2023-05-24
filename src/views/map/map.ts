import Map from "ol/Map"; // 地图实例方法
import View from "ol/View"; // 地图视图方法
import Feature from "ol/Feature";
import Overlay from "ol/Overlay";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer"; // 瓦片渲染方法
import { XYZ, OSM } from "ol/source"; // 瓦片资源
import { defaults as defaultControls } from "ol/control";
import { Draw, Modify, Select } from "ol/interaction";
import { Vector as VectorSource, Cluster } from "ol/source";
import { Style, Stroke, Fill, Circle, Icon, Text } from "ol/style";
import { LineString, Point } from "ol/geom";
import { click, platformModifierKeyOnly } from "ol/events/condition";

import { transform, fromLonLat } from "ol/proj";

export default class olMap {
  constructor(controls: any) {
    this.initMap(controls);
  }
  map = {} as Map;

  draw = null as any;
  //实例化一个矢量图层Vector作为绘制层
  source = new VectorSource();
  routeLayer = {} as any;
  dotsData = [] as any[];
  carPoints = [] as any[];
  featureMove = {} as any;

  timer = null as any;
  routeIndex = 0;
  layerType = 0;
  olPopupText = "";
  selectedFeature = [];

  select = new Select({
    multi: true, //单选
    condition: click,
    toggleCondition: platformModifierKeyOnly,
    filter: (Feature, layer) => {
      return layer === this.vectorLayer;
    },
  });

  // 普通地图资源图层
  tileLayer = new TileLayer({
    // source: new OSM(), //不建议使用，实际开发中会有问题
    source: new XYZ({
      url: "http://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}", // 高德瓦片资源-普通地图
    }),
    visible: true,
  });

  // 混合地图资源图层
  tileLayer2 = new TileLayer({
    source: new XYZ({
      url: "http://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}", // 高德瓦片资源-混合模式
    }),
    visible: false,
  });

  // 区域绘制图层
  vectorLayer = new VectorLayer({
    source: this.source,
    style: new Style({
      fill: new Fill({
        //填充样式
        color: "rgba(252,85,49, 0.2)",
      }),
      stroke: new Stroke({
        //线样式
        color: "#fc5531",
        width: 2,
      }),
      image: new Circle({
        //点样式
        radius: 7,
        fill: new Fill({
          color: "#fc5531",
        }),
      }),
    }),
  });

  // 实例化地图
  initMap(controls: any) {
    this.map = new Map({
      layers: [this.tileLayer, this.tileLayer2, this.vectorLayer], // 图层
      view: new View({
        projection: "EPSG:4326", //坐标类型：EPSG：4326：经纬度坐标，EPSG:3857：投影坐标
        center: [104.07, 30.6], //地图中心点
        zoom: 12, // 缩放级别
        minZoom: 0, // 最小缩放级别
        maxZoom: 18, // 最大缩放级别
        constrainResolution: true, // 因为存在非整数的缩放级别，所以设置该参数为true来让每次缩放结束后自动缩放到距离最近的一个整数级别，这个必须要设置，当缩放在非整数级别时地图会糊
      }),
      target: "map", // DOM容器

      //加载控件到地图容器中
      controls: defaultControls({
        zoom: controls.zoom ?? false, // 不显示放大缩小按钮
        rotate: controls.roate ?? false, // 不显示指北针控件
        attribution: controls.attribution ?? true, // 显示右下角地图信息控件
      }).extend([...controls.otherControls]),
    });

    // 添加绘图区域可编辑功能
    // 创建Modify控件
    let modify = new Modify({ source: this.source });
    // 将控件添加至Map对象中
    this.map.addInteraction(modify);
  }

  // 缩小
  zoomOut() {
    // 使用map对象获取view视图，然后设置View视图的放大，缩小参数即可
    const view = this.map.getView();
    const zoom = view.getZoom();
    view.setZoom(zoom! - 1);
  }

  //放大
  zoomIn() {
    const view = this.map.getView();
    const zoom = view.getZoom();
    view.setZoom(zoom! + 1);
  }

  //圆形绘制
  drawCircle() {
    if (this.draw !== undefined && this.draw !== null) {
      this.map.removeInteraction(this.draw); // 绘制开始先删除之前的图层
    }
    this.draw = new Draw({
      // 通过Draw开启一个绘制图层
      source: this.source,
      type: "Circle",
    });
    this.map.addInteraction(this.draw); // 将绘制的图层添加到地图中
    let _this = this;
    this.draw.on("drawend", function (e: any) {
      // 结束当前绘制
      _this.map.removeInteraction(_this.draw);
      // 绘制结束时获取数据
    });
  }

  // 绘制多边形
  drawPolygon = () => {
    if (this.draw !== undefined && this.draw !== null) {
      this.map.removeInteraction(this.draw!);
    }
    this.draw = new Draw({
      source: this.source,
      type: "Polygon",
    });
    this.map.addInteraction(this.draw);
    let _this = this;
    this.draw.on("drawend", function (e: any) {
      // 结束当前绘制
      _this.map.removeInteraction(_this.draw);
      // 绘制结束时获取数据
    });
  };

  //轨迹线  把每个点连起来
  drawLine = (geometry: any[]) => {
    this.routeLayer = new VectorLayer({
      source: new VectorSource({
        features: [],
      }),
    });
    this.map.addLayer(this.routeLayer);

    //起始点位标志
    let start = new Feature({
      geometry: new Point(geometry[0]),
    });
    start.setStyle(
      new Style({
        image: new Icon({
          src: new URL("../../assets/start.png", import.meta.url).href, //起始图标的url
          scale: 0.7,
          anchor: [0.5, 1],
        }),
      })
    );
    //结束点位标志
    let end = new Feature({
      geometry: new Point(geometry[geometry.length - 1]),
    });
    end.setStyle(
      new Style({
        image: new Icon({
          src: new URL("../../assets/end.png", import.meta.url).href, //终点图标的url
          scale: 0.7,
          anchor: [0.5, 1],
        }),
      })
    );
    this.routeLayer.getSource().addFeature(start);
    this.routeLayer.getSource().addFeature(end);

    let comDots = [] as any[];
    let wireFeature = {} as any;
    geometry.forEach((item: any, index: number) => {
      comDots.push(item);
      wireFeature = new Feature({
        geometry: new LineString(comDots),
      });

      wireFeature.setStyle(
        new Style({
          stroke: new Stroke({
            // 设置边的样式
            color: "rgb(21, 106, 158)",
            width: 5,
          }),
        })
      );

      this.routeLayer.getSource().addFeatures([wireFeature]);
    });
  };

  //创建小车这个要素

  moveStart = (geometry: any[]) => {
    //坐标转换
    this.dotsData = geometry.map((item) => {
      return transform(item, "EPSG:3857", "EPSG:4326");
    });
    //深复制车的位置，不在原数组改变，方便重新播放
    // this.carPoints = JSON.parse(JSON.stringify(this.dotsData));
    this.carPoints = [...this.dotsData];

    //小车最初位置在第一个坐标点
    this.featureMove = new Feature({
      geometry: new Point(this.carPoints[0]),
    });
    this.featureMove.setStyle(
      new Style({
        image: new Icon({
          src: new URL("../../assets/car.png", import.meta.url).href, //图标的url
          scale: 0.7,
          anchor: [0.5, 0.5],
          rotation: this.countRotate(),
        }),
      })
    );
    //添加车辆元素到图层
    this.routeLayer.getSource().addFeature(this.featureMove);
    this.timeStart();
  };

  //计时器开始
  timeStart() {
    this.timer = setInterval(() => {
      if (this.routeIndex + 1 >= this.carPoints.length) {
        //   //重头开始
        //   this.routeIndex = 0;
        //   //移除要素
        this.routeLayer.getSource().removeFeature(this.featureMove);
        //   clearInterval(this.timer);
        //   //重复运动
        //   open(); //自动开启功能
        return;
      }
      //到转折点旋转角度
      if (this.nextPoint() === this.carPoints[this.routeIndex + 1]) {
        this.routeIndex++;
        this.featureMove.getStyle().getImage().setRotation(this.countRotate());
      }
      //改变坐标点
      this.featureMove
        .getGeometry()
        .setCoordinates(fromLonLat(this.carPoints[this.routeIndex]));
    }, 10);
  }

  //计算下一个点的位置
  //这里的算法是计算了两点之间的点   两点之间的连线可能存在很多个计算出来的点
  nextPoint = () => {
    let routeIdx = this.routeIndex;
    let p1 = this.map.getPixelFromCoordinate(
      fromLonLat(this.carPoints[routeIdx])
    ); //获取在屏幕的像素位置
    let p2 = this.map.getPixelFromCoordinate(
      fromLonLat(this.carPoints[routeIdx + 1])
    );
    let dx = p2[0] - p1[0];
    let dy = p2[1] - p1[1];
    //打印可见  在没有走到下一个点之前，下一个点是不变的，前一个点以这个点为终点向其靠近
    let distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= 1) {
      return this.carPoints[routeIdx + 1];
    } else {
      let x = p1[0] + dx / distance;
      let y = p1[1] + dy / distance;
      let coor = transform(
        this.map.getCoordinateFromPixel([x, y]),
        "EPSG:3857",
        "EPSG:4326"
      );
      this.carPoints[routeIdx] = coor; //这里会将前一个点重新赋值  要素利用这个坐标变化进行移动
      return this.carPoints[routeIdx];
    }
  };
  //计算两点之间的角度  算旋转角度
  countRotate = () => {
    let i = this.routeIndex,
      j = i + 1;
    if (j === this.carPoints.length) {
      i--;
      j--;
    }
    let p1 = this.carPoints[i];
    let p2 = this.carPoints[j];
    return Math.atan2(p2[0] - p1[0], p2[1] - p1[1]);
  };

  // 图层切换
  changeMapLayer() {
    if (this.layerType === 0) {
      this.layerType = 1;
      this.map.getLayers().item(0).setVisible(false);
      this.map.getLayers().item(1).setVisible(true);
    } else {
      this.layerType = 0;
      this.map.getLayers().item(1).setVisible(false);
      this.map.getLayers().item(0).setVisible(true);
    }
  }

  // 实现标注聚合
  polymerization(dataSource: any[]) {
    var features = new Array(dataSource.length);
    for (var i = 0; i < dataSource.length; i++) {
      var coordinate = [dataSource[i][0], dataSource[i][1]].map(parseFloat);

      var attr = {
        userName: "测试",
        info: "测试点位显示信息",
        coordinate: fromLonLat(coordinate, "EPSG:4326"),
        type: "marker",
      };
      features[i] = new Feature({
        geometry: new Point(coordinate),
        attribute: attr,
      });
    }

    var source = new VectorSource({
      features: features,
    });
    var clusterSource = new Cluster({
      distance: 30,
      source: source,
    });

    //加载聚合标注的矢量图层
    var styleCache = {} as any;
    var layerVetor = new VectorLayer({
      source: clusterSource,
      style: function (feature) {
        var size = feature.get("features").length;
        var style = styleCache[size];
        if (!style) {
          style = [
            new Style({
              image: new Icon(
                /** @type {olx.style.IconOptions} */ {
                  anchor: [0.5, 10],
                  anchorOrigin: "top-right",
                  anchorXUnits: "fraction",
                  anchorYUnits: "pixels",
                  offsetOrigin: "top-right",
                  offset: [0, 1], //偏移量设置
                  scale: 1.2, //图标缩放比例
                  opacity: 1, //透明度
                  src: new URL(
                    "../../assets/position-icon.png",
                    import.meta.url
                  ).href, //图标的url
                }
              ),
              text: new Text({
                font: "12px Calibri,sans-serif",
                text: size > 1 ? size.toString() : "",
                fill: new Fill({
                  color: "#eee",
                }),
              }),
            }),
          ];
          styleCache[size] = style;
        }
        return style;
      },
    });

    this.map.addLayer(layerVetor);

    const _this = this;
    var content = document.getElementById("popup-content");
    var title = document.getElementById("popup-title");
    var container: any = document.getElementById("pup-container");
    var position: any = document.getElementById("popup-position");
    var overlay = new Overlay({
      element: container,
      autoPan: true,
      positioning: "bottom-center",
    });
    this.map.on("click", function (evt) {
      title!.innerHTML = ``;
      content!.innerHTML = ``;
      position!.innerHTML = ``;
      // 捕捉feature，用于判断是否点击的是标注点
      let feature = _this.map.forEachFeatureAtPixel(
        evt.pixel,
        function (feature, layerVetor) {
          return feature;
        }
      );

      if (feature) {
        if (!feature.getProperties().features) return;
        var attribute = feature.getProperties().features[0].values_.attribute;
        if (attribute.type !== "marker") return;
        let pLen = feature.getProperties().features.length;
        if (pLen === 1) {
          container.style.display = "block";
          var pixel = _this.map.getEventPixel(evt.originalEvent);
          _this.map.forEachFeatureAtPixel(pixel, function (feature) {
            title!.innerHTML = `<p>项目名称: ${attribute.userName}</p>`;
            content!.innerHTML = `<p>项目描述: ${attribute.info}</p>`;
            position!.innerHTML = `<p>项目坐标: ${attribute.coordinate}</p>`;
            overlay.setPosition(attribute.coordinate);
            _this.map.addOverlay(overlay);
          });
        } else {
          container.style.display = "block";
          var pixel = _this.map.getEventPixel(evt.originalEvent);
          _this.map.forEachFeatureAtPixel(pixel, function (feature) {
            content!.innerHTML = `<p>点位聚合个数: ${pLen}</p>`;
            overlay.setPosition(attribute.coordinate);
            _this.map.addOverlay(overlay);
          });
        }
      } else {
        container.style.display = "none";
      }
    });

    /**
     * 为map添加鼠标移动事件监听，当指向标注时改变鼠标光标状态
     */
    this.map.on("pointermove", function (e) {
      var pixel = _this.map.getEventPixel(e.originalEvent);
      var hit = _this.map.hasFeatureAtPixel(pixel);
      _this.map.getTargetElement().style.cursor = hit ? "pointer" : "";
    });
  }

  handleSelected(callback: any) {
    // 添加选中交互
    this.select.setActive(true);
    this.map.addInteraction(this.select);
    this.select.on("select", (evt) => {
      this.selectedFeature = evt.target.getFeatures().getArray();
      callback(this.selectedFeature);
    });
  }

  // 删除选中区域
  deleteFeature(callback: any) {
    this.selectedFeature.forEach((item: any) => {
      this.vectorLayer.getSource()?.removeFeature(item);
    });
  }
}
