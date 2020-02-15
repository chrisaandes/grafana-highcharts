// import { PanelConfig } from './panel-config';
import { MetricsPanelCtrl } from 'grafana/app/plugins/sdk'; // will be resolved to app/plugins/sdk

import './css/panel.base.scss';
// Remove next imports if you don't need separate styles for light and dark themes
import './css/panel.dark.scss';
import './css/panel.light.scss';
// Remove up to here


var _element;

// const Highcharts = require('highcharts');
// try {
//   var Highcharts = require('highcharts');
// } catch (err) { }
var Highcharts = require('highcharts');

// for debugging
window.Highcharts = Highcharts;

class Ctrl extends MetricsPanelCtrl {

  constructor($scope, $injector) {
    console.log("<constructor>");
    console.log("Highcharts version:", Highcharts.version);
    super($scope, $injector);

    // this._panelConfig = new PanelConfig(this.panel);

    this.events.on('data-received', this._onDataReceived.bind(this));
    this.events.on('render', this._onRender.bind(this) );
    // this.events.on('init-edit-mode', () => {console.log("init-edit-mode");} );
    this.events.on('init-edit-mode', this._onInitEditMode.bind(this));
  }

  _onInitEditMode() {
    console.log("_onInitEditMode");
    // var thisPartialPath = this._panelConfig.pluginDirName + 'partials/';
    // this.addEditorTab('Legend', thisPartialPath + 'legend.html', 2);
    this.addEditorTab('Legend',  this.panelPath + 'partials/legend.html', 2);
  }

  get panelPath() {
    if(!this._panelPath) {
      var panels = window['grafanaBootData'].settings.panels;
      var thisPanel = panels[this.pluginId];
      // the system loader preprends publib to the url,
      // add a .. to go back one level
      this._panelPath = '../' + thisPanel.baseUrl + '/';
    }
    return this._panelPath;
  }


  _onRender() {
    // console.log("render");
    if (this.chart) {
      // this.chart.redraw();
      this.chart.setSize(undefined, undefined, false);
    }
  }

  _onDataReceived(data) {
    console.log("----------------------------");
    console.log("_onDataReceived:", data);
    if (!this.chart) {
      this.chart = this._createChart(data);
      console.log("chart:", this.chart); // Highcharts.charts[0]
    } else {
      this._updateChart(data);
    }
  }

  _createChart(data) {
    console.log("_createChart");
    return Highcharts.chart('iz-container', {
      "chart": {
        options: {
            chart: {
                type: 'line'
            },
            title: {
                text: 'LÍNEA DE TENDENCIA GENERAL DE LA FINCA',
                x: -20 //center
            },
            subtitle: {
                text: "BLOQUES: TODOS | BLANCO BIOLÓGICO: ACAROS | Fecha: 28 octubre 2019 / 12 enero 2020",
                x: -20
            },
            xAxis: {
                categories: ["201944", "201945", "201946", "201947", "201948", "201949", "201950", "201951", "201952", "202001", "202002"]
            },
            yAxis: {
                title: {
                    text: "% Incidencia"
                }
            },
            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: true
                    },
                    enableMouseTracking: false
                }
            },
            tooltip: {
                valueSuffix: ''
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle',
                borderWidth: 0
            }
        },
        series: this._makeSeries(data),
      }
    });
  }

  flip(array) {
    // return array.map(([x, y]) => ([y * 1000, x]));
    var offset = new Date().getTimezoneOffset();
    console.log("getTimezoneOffset:", offset, 'min');
    offset = offset * 60 * 1000;
    return array.map(([x, y]) => ([y - offset, x]));
  }

  _makeSeries(data) {  // Highcharts.charts[0]
    console.log("_makeSeries");
    return data.map((timeSerie) => {
      console.log("timeSerie:", timeSerie);

      let min = 0, max = 0, avg = 0, current = 0, total = 0, datos = new Array();
      
      for (var i = 0; i < timeSerie.datapoints.length; i++) {
        if (!isNaN(parseFloat(timeSerie.datapoints[i][0]))) {
          current = timeSerie.datapoints[i][0];
          total += current;
          datos[i] = current;
        }
      }

      if (datos.length > 0) {
        min = Math.min.apply({}, datos); // Math.min(datos);
        max = Math.max.apply({}, datos); // Math.max(datos);
        avg = (total / datos.length);
      }
      
      // console.log("min:", min);
      // console.log("max:", max);
      // console.log("avg:", avg);
      // console.log("current:", current);
      // console.log("total:", total);
      // // console.log("count:", datos.length);
      // // console.log("datos:", datos);       


      return {
        id: timeSerie.target,
        name: timeSerie.target,
        data: this.flip(timeSerie.datapoints),

        _min: min,
        _max: max,
        _avg: avg,
        _current: current,
        _total: min,

        turboThreshold: 0,
        marker: {
          enabled: true,
          symbol: "circle",
          radius: 4
        },
        // color: '#FF0000',
        // yAxis: 1,
        type: "spline"
      }
    });
  }

  _updateChart(data) {
    console.log("_updateChart");
    console.log("this.chart.series:", this.chart.series);

    const series = this._makeSeries(data);
    console.log("series:", series);

    let newOnes = [], oldOnes = [], delOnes = [];
    
    for (let i = 0; i < this.chart.series.length; i++) {
      if (series.find( (serie) => serie.name === this.chart.series[i].name ) ) {
        // console.log("FOUND:", this.chart.series[i]);
      } else {
        console.log("REMOVE:", this.chart.series[i]);
        delOnes.push(this.chart.series[i]);
      }
    }
    console.log("delOnes:", delOnes);

    delOnes.forEach((serie) => {
      serie.remove(true);
    });

    for (let i = 0; i < series.length; i++) {
      if (this.chart.series.find((serie) => serie.name === series[i].name)) {
        oldOnes.push(series[i]);
      } else {
        newOnes.push(series[i]);
      }
    }
    console.log("oldOnes:", oldOnes);
    console.log("newOnes:", newOnes);

    newOnes.forEach((serie) => {
      this.chart.addSeries(serie, false);
    });

    this.chart.update({series: oldOnes}, false);
    this.chart.redraw();
  }


  ///////////////////////////////////////////////////////////////////////////////////

  link(scope, element) {
    this.initStyles();
    this._element = element;
  }

  initStyles() {
    window.System.import(this.panelPath + 'css/panel.base.css!');
    // Remove next lines if you don't need separate styles for light and dark themes
    if (grafanaBootData.user.lightTheme) {
      window.System.import(this.panelPath + 'css/panel.light.css!');
    } else {
      window.System.import(this.panelPath + 'css/panel.dark.css!');
    }
    // Remove up to here
  }

  get panelPath() {
    if (this._panelPath === undefined) {
      this._panelPath = `/public/plugins/${this.pluginId}/`;
    }
    return this._panelPath;
  }
  
}

Ctrl.templateUrl = 'partials/template.html';

export { Ctrl as PanelCtrl }
