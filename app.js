new Vue({
    el: '#app', // Vincula Vue al elemento HTML con ID 'app'
    data: {
        startDate: '', // Fecha inicial seleccionada por el usuario
        endDate: '',   // Fecha final seleccionada por el usuario
        rates: [],     // Lista para almacenar los datos filtrados
        firstRowDate: null, // Fecha inicial (primera fila de Google Sheets)
        lastRowDate: null   // Fecha final (última fila de Google Sheets)
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
        async liquidar() {
            if (!this.startDate || !this.endDate) {
                alert('Por favor, selecciona una fecha inicial y final.');
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

            this.fetchRates();
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
        async fetchRates() {
            const idSheets = '1Bd6qpAW36V8sVbcpjFkfD17t4IPPYiVkPFpXHNCGFLQ';
            const apiKey = 'AIzaSyAYGHByZLx72_QpK8jSCkz-v54vnkjhdfU';
            const values = 'A2:E1000';
            let tasaEfectiva=0;
            let tasaNominal=0;
            let tasaDiaria=0;

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
                    tasaDiaria=(tasaNominal/360)
                    this.rates = [{
                        date: this.convertirFechaLargaAFormatoCorto(new Date(new Date(this.startDate).getTime() + 18000000)),
                        value: this.convertirFechaLargaAFormatoCorto(new Date(new Date(this.endDate).getTime() + 18000000)),
                        days: Math.ceil((new Date(new Date(this.endDate).getTime() + 18000000) - new Date(new Date(this.startDate).getTime() + 18000000)) / (1000 * 60 * 60 * 24) + 1 ),
                        rate:(tasaEfectiva*100).toFixed(3)+"%",
                        rateN:(tasaNominal*100).toFixed(3)+"%",
                        rateD:(tasaDiaria*100).toFixed(3)+"%"
                    }];
                } else {
                    this.rates = filteredData.map(row => {
                        const fechaInicioColumna = this.convertirAFecha(row[0]);
                        const fechaFinColumna = this.convertirAFecha(row[1]);
                        const fechaInicial = new Date(new Date(this.startDate).getTime() + 18000000);
                        const fechaFinal = new Date(new Date(this.endDate).getTime() + 18000000);

                        let dias = 0;
                        if (fechaInicial >= fechaInicioColumna && fechaInicial <= fechaFinColumna) {
                            dias = Math.ceil((fechaFinColumna - fechaInicial) / (1000 * 60 * 60 * 24) + 1 );
                            tasaEfectiva=(parseFloat(row[2].replace(",","."))/100);
                            tasaNominal=(((1+tasaEfectiva)**(1/12)-1)*12);
                            tasaDiaria=(tasaNominal/360)
                            return {
                                date: this.convertirFechaLargaAFormatoCorto(fechaInicial),
                                value: row[1],
                                days: dias,
                                rate:(tasaEfectiva*100).toFixed(3)+"%",
                                rateN:(tasaNominal*100).toFixed(3)+"%",
                                rateD:(tasaDiaria*100).toFixed(3)+"%"
                            };
                        } else if (fechaFinal >= fechaInicioColumna && fechaFinal <= fechaFinColumna) {
                            dias = Math.ceil((fechaFinal - fechaInicioColumna) / (1000 * 60 * 60 * 24) + 1);
                            tasaEfectiva=(parseFloat(row[2].replace(",","."))/100);
                            tasaNominal=(((1+tasaEfectiva)**(1/12)-1)*12);
                            tasaDiaria=(tasaNominal/360)
                            return {
                                date: this.convertirFechaLargaAFormatoCorto(fechaInicioColumna),
                                value: this.convertirFechaLargaAFormatoCorto(fechaFinal),
                                days: dias,
                                rate:(tasaEfectiva*100).toFixed(3)+"%",
                                rateN:(tasaNominal*100).toFixed(3)+"%",
                                rateD:(tasaDiaria*100).toFixed(3)+"%"
                            };
                        } else {
                            dias = Math.ceil((fechaFinColumna - fechaInicioColumna) / (1000 * 60 * 60 * 24)+ 1);
                            tasaEfectiva=(parseFloat(row[2].replace(",","."))/100);
                            tasaNominal=(((1+tasaEfectiva)**(1/12)-1)*12);
                            tasaDiaria=(tasaNominal/360)
                            return {
                                date: this.convertirFechaLargaAFormatoCorto(fechaInicioColumna),
                                value: row[1],
                                days: dias,
                                rate:(tasaEfectiva*100).toFixed(3)+"%",
                                rateN:(tasaNominal*100).toFixed(3)+"%",
                                rateD:(tasaDiaria*100).toFixed(3)+"%"
                            };
                        }
                    });
                }
            } catch (error) {
                console.error('Error al obtener tasas:', error);
                alert('Error al obtener tasas. Inténtalo de nuevo más tarde.');
            }
        }
    }
});
