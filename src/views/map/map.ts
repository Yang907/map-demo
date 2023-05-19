import Map from "ol/Map"; // 地图实例方法
import View from "ol/View"; // 地图视图方法
import Feature from "ol/Feature";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer"; // 瓦片渲染方法
import { XYZ, OSM } from "ol/source"; // 瓦片资源
import { onMounted, ref } from "vue";
import { ScaleLine, defaults as defaultControls } from "ol/control";
import {
  Crop,
  CirclePlus,
  Remove,
  Aim,
  Position,
} from "@element-plus/icons-vue";
import { Draw } from "ol/interaction";
import { Vector as VectorSource } from "ol/source";
import { Style, Stroke, Fill, Circle, Icon } from "ol/style";
import { LineString, Point } from "ol/geom";
import geometry from "./data/trajectory";

import { transform, fromLonLat } from "ol/proj";

export default class {
  constructor() {
    this.initMap();
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

  tileLayer = new TileLayer({
    // 加载瓦片资源

    // source: new OSM(), //不建议使用，实际开发中会有问题
    source: new XYZ({
      url: "http://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}", // 高德瓦片资源
    }),
  });

  // 实例化地图
  initMap() {
    this.map = new Map({
      layers: [this.tileLayer],
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
        zoom: false, // 不显示放大缩小按钮
        rotate: false, // 不显示指北针控件
        attribution: false, // 不显示右下角地图信息控件
      }).extend([
        new ScaleLine({
          //设置比例尺单位，degrees、imperial、us、nautical、metric（度量单位）
          units: "metric",
        }),
      ]),
    });
    // 区域绘制图层
    var vectorLayer = new VectorLayer({
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
    //将绘制层添加到地图容器中
    this.map.addLayer(vectorLayer);
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
      this.map.removeInteraction(this.draw);
    }
    this.draw = new Draw({
      source: this.source,
      type: "Circle",
    });
    this.map.addInteraction(this.draw);
    this.draw.on("drawend", function (e: any) {
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
    this.draw.on("drawend", function (e: any) {
      // 绘制结束时获取数据
    });
  };

  //轨迹线  把每个点连起来
  drawLine = () => {
    this.routeLayer = new VectorLayer({
      source: new VectorSource({
        features: [],
      }),
    });
    this.map.addLayer(this.routeLayer);

    let comDots = [] as any[];
    let wireFeature = {} as any;
    geometry.forEach((item: any) => {
      comDots.push(item);
      wireFeature = new Feature({
        geometry: new LineString(comDots),
      });
      wireFeature.setStyle(
        new Style({
          stroke: new Stroke({
            // 设置边的样式
            color: "rgb(21, 106, 158)",
            width: 3,
          }),
        })
      );
      this.routeLayer.getSource().addFeatures([wireFeature]);
    });
  };

  //创建小车这个要素

  moveStart = () => {
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
          src: "https://openlayers.org/en/v4.6.5/examples/data/icon.png",
          scale: 0.85,
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
        //重头开始
        this.routeIndex = 0;
        //移除要素
        this.routeLayer.getSource().removeFeature(this.featureMove);
        clearInterval(this.timer);
        //重复运动
        open(); //自动开启功能
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
}
