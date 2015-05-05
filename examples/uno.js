//configuracion de este estilo de grafica
var parseDate = d3.time.format(formato).parse;
var formatDate = d3.time.format(formato);



var p = new StockTools("#chart-header", periodos);

var chart = c3.generate({
  data: datos,
  axis: {
    x: {
      type: 'timeseries',
      tick: {
        format: formato
      }
    },
    subchart: {
      show: true
    },
    zoom: {
      enabled: true
    },
    grid: {
      x: {
        show: true
      }
    }
  }
});
