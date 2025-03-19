if (localStorage.getItem('auth') !== 'true') {
    window.location.href = 'login.html'; // Redirigir al login si no está autenticado
};
Vue.filter('formatoMoneda', function(valor) {
    if (!valor) return '0.00';

    return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor);
});

new Vue({
    el: '#app', // Vincula Vue al elemento HTML con ID 'app'
    data: {
        startDate: '', // Fecha inicial seleccionada por el usuario
        endDate: '',  
        capital:'', // Fecha final seleccionada por el usuario
        rates: [],     // Lista para almacenar los datos filtrados
        firstRowDate: null, // Fecha inicial (primera fila de Google Sheets)
        lastRowDate: null,   // Fecha final (última fila de Google Sheets)
        totalCapital: 0,    // Total acumulado del capital
        totalIntereses: 0 
    },
    methods: {
        // Función para convertir una cadena de texto a un objeto Date
        convertirAFecha(fechaStr) {
            let [dia, mes, año] = fechaStr.split('/').map(Number);
            dia = dia.toString().padStart(2, '0');
            return new Date(año, mes - 1, dia); // El mes en JavaScript empieza en 0 (enero)
        },
        convertirFechaLargaAFormatoCorto(fechaLarga) {
            const fecha = new Date(fechaLarga);
            const dia = fecha.getDate();
            const mes = fecha.getMonth() + 1;
            const año = fecha.getFullYear();
            return `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${año}`;
        },
        
           // Permitir solo números enteros durante la escritura
    permitirNumerosEnteros(event) {
        const valor = event.target.value.replace(/[^0-9]/g, ''); // Elimina cualquier carácter que no sea numérico
        this.capital = valor; // Actualiza el modelo con el valor limpio
    },
    // Formatear el valor como entero al perder el foco
    formatearCapitalEntero() {
        if (!this.capital) return; // Si está vacío, no formatea

        // Convertir el valor a número entero
        let numero = parseInt(this.capital.replace(/,/g, ''), 10);

        if (!isNaN(numero)) {
            // Aplica formato con separación de miles (sin decimales)
            this.capital = new Intl.NumberFormat('en-US', {
                style: 'decimal',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(numero);
        } else {
            this.capital = ''; // Si no es válido, resetea el campo
        }
    },
        
    formatearIntereses(valor) {
        if (!valor) return ''; // Si no hay valor, devuelve una cadena vacía

        // Si el valor contiene un punto decimal, se mantiene como está
        valor = valor.toString().replace('.', '.');

        // Convierte el valor a un número flotante
        const numero = parseFloat(valor);

        if (isNaN(numero)) return ''; // Si no es un número válido, devuelve una cadena vacía

        // Aplica formato con separación de miles (comas) y hasta 2 decimales (puntos)
        return new Intl.NumberFormat('en-US', { // Cambiado al formato en-US
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numero);
    },
    actualizarTotales() {
        // Calcula el capital inicial
        this.capital = this.capital;
        // Calcula el total de intereses
        this.totalIntereses = this.rates.reduce((sum, rate) => sum + parseFloat(rate.interest.replace(/,/g, '')), 0);
    
        // Calcula el total del capital sumando el capital inicial más los intereses
        this.totalCapital = parseFloat(this.capital.replace(/,/g, '')) + this.totalIntereses;
    },
    
    
        async liquidar() {
            if (!this.startDate || !this.endDate) {
                alert('Por favor, selecciona una fecha inicial y final.');
                return;
            }
           // Desformatea el capital antes de validarlo
           const capitalNumerico = parseFloat(this.capital.replace(/,/g, ''));
           if (!capitalNumerico || capitalNumerico <= 0) {
               alert('Por favor, ingresa un capital válido mayor a 0.');
               return;
           }
            const fechaInicial = new Date(new Date(this.startDate).getTime() + 18000000); // Ajusta zona horaria
            const fechaFinal = new Date(new Date(this.endDate).getTime() + 18000000);     // Ajusta zona horaria

            if (fechaFinal < fechaInicial) {
                alert('La fecha final debe ser mayor o igual a la fecha inicial.');
                return;
            }

            if (!this.firstRowDate || !this.lastRowDate) {
                await this.obtenerFechasLimite();
            }

            if (fechaInicial < this.firstRowDate) {
                alert(`La fecha inicial no puede ser menor a ${this.convertirFechaLargaAFormatoCorto(this.firstRowDate)}.`);
                return;
            }

            if (fechaFinal > this.lastRowDate) {
                alert(`La fecha final no puede ser mayor a ${this.convertirFechaLargaAFormatoCorto(this.lastRowDate)}.`);
                return;
            }

            this.fetchRates(capitalNumerico);
        },
        async obtenerFechasLimite() {
            const idSheets = '1Bd6qpAW36V8sVbcpjFkfD17t4IPPYiVkPFpXHNCGFLQ';
            const apiKey = 'AIzaSyAYGHByZLx72_QpK8jSCkz-v54vnkjhdfU';
            const values = 'A2:E1000';

            try {
                const response = await axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${idSheets}/values/${values}?key=${apiKey}`);
                const data = response.data.values;
                this.firstRowDate = this.convertirAFecha(data[0][0]);
                this.lastRowDate = this.convertirAFecha(data[data.length - 1][1]);
            } catch (error) {
                console.error('Error al obtener las fechas límite:', error);
                alert('Error al obtener las fechas de la hoja. Inténtalo de nuevo más tarde.');
            }
        },
        async fetchRates(capitalNumerico) {
            const idSheets = '1Bd6qpAW36V8sVbcpjFkfD17t4IPPYiVkPFpXHNCGFLQ';
            const apiKey = 'AIzaSyAYGHByZLx72_QpK8jSCkz-v54vnkjhdfU';
            const values = 'A2:E1000';
            let tasaEfectiva=0;
            let tasaNominal=0;
            let tasaDiaria=0;
            let dias=0;
            let intereses=0;
            
            try {
                const response = await axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${idSheets}/values/${values}?key=${apiKey}`);
                const data = response.data.values;

                const filteredData = data
                    .filter(row => {
                        const fechaInicioColumna = this.convertirAFecha(row[0]);
                        const fechaFinColumna = this.convertirAFecha(row[1]);
                        const fechaInicial = new Date(new Date(this.startDate).getTime() + 18000000);
                        const fechaFinal = new Date(new Date(this.endDate).getTime() + 18000000);

                        return fechaFinColumna >= fechaInicial && fechaInicioColumna <= fechaFinal;
                    });

                if (filteredData.length === 1) {
                    const row = filteredData[0];
                    tasaEfectiva=(parseFloat(row[2].replace(",","."))/100);
                    tasaNominal=(((1+tasaEfectiva)**(1/12)-1)*12);
                    tasaDiaria=(tasaNominal/360);
                    dias=Math.ceil((new Date(new Date(this.endDate).getTime() + 18000000) - new Date(new Date(this.startDate).getTime() + 18000000)) / (1000 * 60 * 60 * 24) + 1 );
                 
                    intereses=(parseInt(this.capital.replace(/,/g, ''))*tasaDiaria*dias);
                    this.rates = [{
                        date: this.convertirFechaLargaAFormatoCorto(new Date(new Date(this.startDate).getTime() + 18000000)),
                        value: this.convertirFechaLargaAFormatoCorto(new Date(new Date(this.endDate).getTime() + 18000000)),
                        days: dias,
                        rate:(tasaEfectiva*100).toFixed(3)+"%",
                        rateN:(tasaNominal*100).toFixed(3)+"%",
                        rateD:(tasaDiaria*100).toFixed(3)+"%",
                        interest:this.formatearIntereses(intereses)
                    }];
                } else {
                    this.rates = filteredData.map(row => {
                        const fechaInicioColumna = this.convertirAFecha(row[0]);
                        const fechaFinColumna = this.convertirAFecha(row[1]);
                        const fechaInicial = new Date(new Date(this.startDate).getTime() + 18000000);
                        const fechaFinal = new Date(new Date(this.endDate).getTime() + 18000000);

                       
                        if (fechaInicial >= fechaInicioColumna && fechaInicial <= fechaFinColumna) {
                            dias = Math.ceil((fechaFinColumna - fechaInicial) / (1000 * 60 * 60 * 24) + 1 );
                            tasaEfectiva=(parseFloat(row[2].replace(",","."))/100);
                            tasaNominal=(((1+tasaEfectiva)**(1/12)-1)*12);
                            tasaDiaria=(tasaNominal/360);
                            
                    intereses=(parseInt(this.capital.replace(/,/g, ''))*tasaDiaria*dias);
                            return {
                                date: this.convertirFechaLargaAFormatoCorto(fechaInicial),
                                value: row[1],
                                days: dias,
                                rate:(tasaEfectiva*100).toFixed(3)+"%",
                                rateN:(tasaNominal*100).toFixed(3)+"%",
                                rateD:(tasaDiaria*100).toFixed(3)+"%",
                                interest:this.formatearIntereses(intereses)
                            };
                        } else if (fechaFinal >= fechaInicioColumna && fechaFinal <= fechaFinColumna) {
                            dias = Math.ceil((fechaFinal - fechaInicioColumna) / (1000 * 60 * 60 * 24) + 1);
                            tasaEfectiva=(parseFloat(row[2].replace(",","."))/100);
                            tasaNominal=(((1+tasaEfectiva)**(1/12)-1)*12);
                            tasaDiaria=(tasaNominal/360);
                           
                    intereses=(parseInt(this.capital.replace(/,/g, ''))*tasaDiaria*dias);
                            return {
                                date: this.convertirFechaLargaAFormatoCorto(fechaInicioColumna),
                                value: this.convertirFechaLargaAFormatoCorto(fechaFinal),
                                days: dias,
                                rate:(tasaEfectiva*100).toFixed(3)+"%",
                                rateN:(tasaNominal*100).toFixed(3)+"%",
                                rateD:(tasaDiaria*100).toFixed(3)+"%",
                                interest:this.formatearIntereses(intereses)
                            };
                        } else {
                            dias = Math.ceil((fechaFinColumna - fechaInicioColumna) / (1000 * 60 * 60 * 24)+ 1);
                            tasaEfectiva=(parseFloat(row[2].replace(",","."))/100);
                            tasaNominal=(((1+tasaEfectiva)**(1/12)-1)*12);
                            tasaDiaria=(tasaNominal/360);
                            
                    intereses=(parseInt(this.capital.replace(/,/g, ''))*tasaDiaria*dias);
                            return {
                                date: this.convertirFechaLargaAFormatoCorto(fechaInicioColumna),
                                value: row[1],
                                days: dias,
                                rate:(tasaEfectiva*100).toFixed(3)+"%",
                                rateN:(tasaNominal*100).toFixed(3)+"%",
                                rateD:(tasaDiaria*100).toFixed(3)+"%",
                                interest:this.formatearIntereses(intereses)
                            };
                        }
                    });
                    // Actualiza los totales después de procesar las tasas
                
                }
                this.actualizarTotales();
            } catch (error) {
                console.error('Error al obtener tasas:', error);
                alert('Error al obtener tasas. Inténtalo de nuevo más tarde.');
            }
        },
        descargarExcel() {
            // Crear un libro y una hoja de trabajo
            const workbook = XLSX.utils.book_new();
            const datosTabla = this.rates.map(rate => ({
                'Fecha Inicial': rate.date,
                'Fecha Final': rate.value,
                'Días': rate.days,
                'Tasa E.A.': rate.rate,
                'Tasa Nominal': rate.rateN,
                'Tasa Diaria': rate.rateD,
                'Intereses': rate.interest
            }));
        
            // Añadir fila para los totales formateados
            datosTabla.push(
                { 
                    'Fecha Inicial': '', 
                    'Fecha Final': '', 
                    'Días': '', 
                    'Tasa E.A.': '', 
                    'Tasa Nominal': '', 
                    'Tasa Diaria': 'Total Capital:', 
                    'Intereses': this.capital
                },
                { 
                    'Fecha Inicial': '', 
                    'Fecha Final': '', 
                    'Días': '', 
                    'Tasa E.A.': '', 
                    'Tasa Nominal': '', 
                    'Tasa Diaria': 'Total Intereses:', 
                    'Intereses': new Intl.NumberFormat('en-US', { 
                        style: 'decimal', 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                    }).format(this.totalIntereses)
                },
                { 
                    'Fecha Inicial': '', 
                    'Fecha Final': '', 
                    'Días': '', 
                    'Tasa E.A.': '', 
                    'Tasa Nominal': '', 
                    'Tasa Diaria': 'Deuda Total:', 
                    'Intereses': new Intl.NumberFormat('en-US', { 
                        style: 'decimal', 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                    }).format(this.totalCapital)
                }
            );
        
            const hojaTrabajo = XLSX.utils.json_to_sheet(datosTabla);
        
            // Agregar hoja al libro
            XLSX.utils.book_append_sheet(workbook, hojaTrabajo, "Tasas");
        
            // Exportar el archivo Excel
            XLSX.writeFile(workbook, "Tasas_Por_Mes.xlsx");
        },        
        
    }
});

    // Tiempo de inactividad en milisegundos
    const tiempoInactividad = 900000; // 5 segundos
    let timeout;

    // Función para cerrar la sesión
    function cerrarSesion() {
        alert('Tu sesión ha expirado por inactividad.');
        localStorage.removeItem('auth'); // Elimina la autenticación
        window.location.href = 'login.html'; // Redirige al login
    }

    // Restablecer el temporizador cuando haya actividad
    function resetearTiempo() {
        clearTimeout(timeout); // Limpia el temporizador anterior
        timeout = setTimeout(cerrarSesion, tiempoInactividad); // Reinicia el temporizador
    }

    // Escuchar eventos del usuario
    window.onload = resetearTiempo; // Cuando se carga la página
    document.onmousemove = resetearTiempo; // Movimiento del mouse
    document.onkeydown = resetearTiempo; // Teclas presionadas
    document.ontouchstart = resetearTiempo; // Toques en pantalla táctil

// Función para cerrar sesión
function cerrarSesion() {
    alert('Has cerrado sesión exitosamente.');
    localStorage.removeItem('auth'); // Eliminar autenticación
    window.location.href = 'login.html'; // Redirigir al login
}