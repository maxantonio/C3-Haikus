//configuracion de este estilo de grafica
var parseDate = d3.time.format(formato).parse;
var formatDate = d3.time.format(formato);


var p = new StockTools("#chart-header", periodos);


datos_aleatorios(total_datos);

//Genera datos aleatorios a partir de la fecha actual hacia atras
function datos_aleatorios(cant) {
    var fechas = ["x"];
    var maxcom = ["MAXCOM"];
    var ipc = ["IPC"];

    var fecha = new Date();
    fecha.setDate(fecha.getDate() - cant);

    for (var i = 1; i <= cant; i++) {
        fecha.setDate(fecha.getDate() + 1);
        fechas.push(formatDate(fecha));
        maxcom.push(Math.floor((Math.random() * 900) + 200));
        ipc.push(Math.floor((Math.random() * 900) + 200));
    }

    datos.columns = [fechas, maxcom, ipc];
}


var chart = c3.generate({
    data: datos,
    axis: {
        x: {
            type: 'timeseries',
            tick: {
                format: formato
            }
        }
    },
    zoom: {
        enabled: true
    },
    grid: {
        x: {
            show: true
        },
        y: {
            show: true
        }
    }
});
