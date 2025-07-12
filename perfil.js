new Vue({
  el: '#perfilApp',
  data: {
    usuario: {
      nombre: '',
      correo: localStorage.getItem('userEmail') || '',
      telefono: '',
      password: ''
    },
    correoInicial: '',
    passwordInicial: '',
    diasRestantes: '',
    historialSuscripciones: [],
    cargando: false
  },
  async created() {
    const correo = localStorage.getItem('userEmail') || '';
    if (!correo) return;

    this.cargando = true;
    try {
      const idSheets = '1Bd6qpAW36V8sVbcpjFkfD17t4IPPYiVkPFpXHNCGFLQ';
      const apiKey = 'AIzaSyAYGHByZLx72_QpK8jSCkz-v54vnkjhdfU';

      // 🔍 Cargar desde users
      const resUsers = await axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${idSheets}/values/users!C2:F1000?key=${apiKey}`);
      const fila = resUsers.data.values.find(r => r[1] === correo);
      if (fila) {
        this.usuario.nombre = fila[0];
        this.usuario.correo = fila[1];
        this.usuario.telefono = fila[2];
        this.usuario.password = fila[3];
        this.correoInicial = fila[1];
        this.passwordInicial = fila[3];
      }

      // 🔍 Cargar suscripciones y procesarlas
      const resSub = await axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${idSheets}/values/suscripcion!C2:F1000?key=${apiKey}`);
      const suscripciones = resSub.data.values.filter(r => r[0] === correo);
      
      // Procesar historial de suscripciones
      this.historialSuscripciones = suscripciones.map(sub => {
        const fechaInicio = sub[1] || 'N/A';
        const fechaFin = sub[2] || 'N/A';
        const tipo = sub[3] || 'Suscripción estándar';
        
        // Calcular estado y duración
        const fechaFinObj = this.convertirFecha(fechaFin);
        const fechaInicioObj = this.convertirFecha(fechaInicio);
        const hoy = new Date();
        
        let estado = 'Desconocido';
        let estadoClass = 'unknown';
        let activa = false;
        
        if (fechaFinObj) {
          if (fechaFinObj >= hoy) {
            estado = 'Activa';
            estadoClass = 'active';
            activa = true;
          } else {
            estado = 'Expirada';
            estadoClass = 'expired';
          }
        }
        
        // Calcular duración
        let duracion = 'N/A';
        if (fechaInicioObj && fechaFinObj) {
          const diferenciaDias = Math.ceil((fechaFinObj - fechaInicioObj) / (1000 * 60 * 60 * 24));
          duracion = `${diferenciaDias} días`;
        }
        
        return {
          fechaInicio,
          fechaFin,
          tipo,
          estado,
          estadoClass,
          activa,
          duracion
        };
      });
      
      // Ordenar por fecha de inicio (más reciente primero)
      this.historialSuscripciones.sort((a, b) => {
        const fechaA = this.convertirFecha(a.fechaInicio);
        const fechaB = this.convertirFecha(b.fechaInicio);
        return fechaB - fechaA;
      });

      // Calcular días restantes de la suscripción activa
      if (suscripciones.length > 0) {
        const ultima = suscripciones[suscripciones.length - 1];
        const [d, m, y] = ultima[2].split('/').map(Number);
        const fechaFinal = new Date(y, m - 1, d);
        const hoy = new Date();
        const diff = Math.ceil((fechaFinal - hoy) / (1000 * 60 * 60 * 24));
        this.diasRestantes = diff >= 0 ? diff : 'Expirada';
      }

    } catch (err) {
      console.error('Error cargando datos del perfil', err);
    } finally {
      this.cargando = false;
    }
  },
  methods: {
    // Convertir fecha del formato DD/MM/YYYY a objeto Date
    convertirFecha(fechaStr) {
      if (!fechaStr || fechaStr === 'N/A') return null;
      try {
        const [d, m, y] = fechaStr.split('/').map(Number);
        return new Date(y, m - 1, d);
      } catch (error) {
        return null;
      }
    },
    
    async guardarCambios() {
      // 🔐 Validar si cambió correo o password
      if (this.usuario.correo !== this.correoInicial || this.usuario.password !== this.passwordInicial) {
        alert('Se requiere validación adicional para cambiar el correo o contraseña.');
        return;
      }

      this.mostrarToast('Datos actualizados (simulado).', 'success');
    },
    mostrarToast(msg, tipo = 'info') {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = `toast ${tipo}`;
      toast.innerText = msg;
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    }
  }
});
