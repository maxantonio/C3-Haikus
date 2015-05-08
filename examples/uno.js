//configuracion de este estilo de grafica
var parseDate = d3.time.format(formato).parse;
var formatDate = d3.time.format(formato);
var bisect = d3.bisector(function (d) {
    return parseDate(d);
}).left;

//Dice si actualmente se esta comparando o no
var comparando = false;

datos_aleatorios(total_datos);
var p = new StockTools("#chart-header", periodos);

//Genera datos aleatorios a partir de la fecha actual hacia atras
function datos_aleatorios(cant) {
    var fechas = ["x"];
    var maxcom = ["MAXCOM"];
    var ipc = ["IPC"];
    var yahoo = ["YAHOO"];

    var fecha = new Date();
    fecha.setDate(fecha.getDate() - cant);

    for (var i = 1; i <= cant; i++) {
        fecha.setDate(fecha.getDate() + 1);
        fechas.push(formatDate(fecha));
        maxcom.push(Math.floor((Math.random() * 850) + 345));
        ipc.push(Math.floor((Math.random() * 650) + 140));
        yahoo.push(Math.floor((Math.random() * 780) + 354));
    }

    datos.columns = [fechas, maxcom, ipc, yahoo];
    // datos.hide = ["IPC"]; asi tambien la puedo ocultar pero no se oculto de la leyenda
}


var chart = c3.generate({
    data: datos,
    axis: {
        x: {
            type: 'timeseries',
            tick: {
                format: formato
            }
        },
        y: {
            tick: {
                format: function (value) {
                    console.info(value);

                    if (d3.format(",.2f")(value) == '-0.00')
                        return "0%";
                    if (value != 0)
                        return comparando ? d3.format(",.2f")(value) + "%" : d3.format('s')(value);
                    return value + "%";
                }
            }
        }
    },
    zoom: {
        enabled: false
    },
    grid: {
        x: {
            show: true
        },
        y: {
            show: true
        }
    },
    tooltip: {
        format: {
            title: function (d) {
                return d3.time.format("%a %d %b, %Y")(d)
            },
            value: function (value, ratio, id) {
                return comparando ? value + "%" : d3.format(',')(value);
            }
        }
    }
});

//Oculta todas menos la principal
//chart.hide('IPC', {withLegend: true});
//chart.hide('YAHOO', {withLegend: true});

//Quita los datos correspondientes de esta grafica
chart.unload({
    ids: ['IPC', 'YAHOO']
});