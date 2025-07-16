 new Vue({
  el: '#perfilApp',
  data: {
    showPwd: false,
    usuario: { nombre:'', correo:'', telefono:'', password:'' },
    correoInicial: '',
    passwordInicial: '',
    idUsuario:'',
    diasRestantes: '',
    cargando: false,
    otpRequired: false,
    otpCode: '',
    toasts: []
  },
  async created() {
    this.cargando = true;
    // 1) cargo email desde el localStorage
    this.usuario.correo = localStorage.getItem('userEmail') || '';
    this.correoInicial = this.usuario.correo;

    const idSheets = '1Bd6qpAW36V8sVbcpjFkfD17t4IPPYiVkPFpXHNCGFLQ';
    const apiKey   = 'AIzaSyAYGHByZLx72_QpK8jSCkz-v54vnkjhdfU';

    try {
      // 2) Traer datos de USERS
      const respUsers = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${idSheets}/values/users!B2:F1000?key=${apiKey}`
      );
      const rowsUsers = respUsers.data.values || [];

      const userRow = rowsUsers.find(r => (r[2]||'').toLowerCase() === this.usuario.correo.toLowerCase());
      
      if (userRow) {
        this.usuario.nombre   = userRow[1];
        this.usuario.telefono = userRow[3];
        this.usuario.password = userRow[4];
        this.passwordInicial  = userRow[4];
        this.idUsuario= userRow[0];
       
      }

      // 3) Traer datos de SUSCRIPCION
      const respSubs = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${idSheets}/values/suscripcion!B2:E1000?key=${apiKey}`
      );
      const rowsSubs = respSubs.data.values || [];
     
      const misFilas  = rowsSubs.filter(r => (r[1]||'').toLowerCase() === this.usuario.correo.toLowerCase());
      
      if (misFilas.length) {
        const ult = misFilas[misFilas.length - 1];
        const [d,m,y] = ult[3].split('/').map(n=>+n);
        const fechaFin = new Date(y,m-1,d);
        const diff = Math.ceil((fechaFin - new Date())/(1000*60*60*24));
        this.diasRestantes = diff>=0? diff : 'Expirada';
      }

    } catch(err) {
      console.error(err);
      this.showToast('Error cargando datos','error');
    } finally {
      this.cargando = false;
    }
  },
  methods: {
    showToast(msg, tipo='info'){
      this.toasts.push({ msg, tipo });
      setTimeout(()=> this.toasts.shift(), 4000);
    },

    async guardarCambios(){
      // validaciones
      if (!this.usuario.nombre || !this.usuario.telefono) {
        return this.showToast('Completa todos los datos','error');
      }
      // Si cambió correo o contraseña → OTP
      if (this.usuario.correo.toLowerCase() !== this.correoInicial.toLowerCase()
          || this.usuario.password !== this.passwordInicial) {
        this.otpRequired = true;
        return await this.enviarOTP();
      }
      // sino → actualizo directo
    
      await this.updateProfile();
    },

    async enviarOTP(){
      try{
        this.cargando=true;
          const code = Math.floor(100000 + Math.random()*900000).toString();
      const now = new Date();
      const expires = new Date(now.getTime() + 15 * 60 * 1000);

  // Formatear fecha y hora para mostrar en el correo
  // Ej: '01/05/2025 14:37'
  const pad = n => n.toString().padStart(2, '0');
  const fechaExp = 
    pad(expires.getDate()) + '/' +
    pad(expires.getMonth() + 1) + '/' +
    expires.getFullYear();
  const horaExp = 
    pad(expires.getHours()) + ':' +
    pad(expires.getMinutes());

  const expirationString = `${fechaExp} ${horaExp}`;
      await emailjs.send('service_omqfg48','template_Reset_Password',{
        email: this.usuario.correo, passcode: code, time: expirationString
      });

     const response= await fetch('https://script.google.com/macros/s/AKfycbxMtt6eP3JErCTukrkIjCl4u9yEJ5E5Aa19pYIewRRNlnhnvLXjLvi_PaPr2q7jb88Z/exec', {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                action:'store_otp_profile',
          id_user: this.idUsuario,
          correo: this.usuario.correo,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          code,
          motivo:'change_profile'
              })
            });
      
      //  Parsea la respuesta como JSON
    const data = await response.json();
if(data.status='error')
{
this.showToast(data.message, 'error');
}
else{
this.showToast(data.correoActual,'info');
}
      
      
      }
      catch(err){
        
      }
      finally{
this.cargando=false;
      }
      
     
    },

async verificarOTP() {
  try {
    this.cargando=true;
    // 1) Construimos el payload
    const payload = {
      action: 'verify_otp_profile',
      correo: this.usuario.correo,
      code:   this.otpCode
    };

    // 2) Enviamos la petición POST al Web App de GAS
    const response = await fetch('https://script.google.com/macros/s/AKfycbxMtt6eP3JErCTukrkIjCl4u9yEJ5E5Aa19pYIewRRNlnhnvLXjLvi_PaPr2q7jb88Z/exec', {
        method:  'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body:    JSON.stringify(payload)
      }
    );

    // 3) Parsea la respuesta como JSON
    const data = await response.json();

    // 4) Valida la propiedad `valid` tal como la devuelve handleVerifyOtpProfile
    if (data.valid) {
      // OTP correcto → procede a actualizar perfil
      await this.updateProfile();
    } else {
      // OTP inválido o expirado
      this.showToast(data.message || 'Código inválido', 'error');
    }

  } catch (err) {
    console.error('Error verificando OTP:', err);
    this.showToast('Error de conexión al verificar OTP', 'error');
  }
  finally{
    this.cargando=false;
  }
},


    async updateProfile(){
      this.cargando = true;
      const payload = {
  action: 'update_profile',
  nombre: this.usuario.nombre,
  correo: this.usuario.correo,
  telefono: this.usuario.telefono,
  password: this.usuario.password
};
      try {
        
    await fetch('https://script.google.com/macros/s/AKfycbxMtt6eP3JErCTukrkIjCl4u9yEJ5E5Aa19pYIewRRNlnhnvLXjLvi_PaPr2q7jb88Z/exec', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
      });
      
        localStorage.setItem('userEmail', this.usuario.correo);
        this.showToast('Perfil actualizado','success');
        // reset iniciales
        this.correoInicial   = this.usuario.correo;
        this.passwordInicial = this.usuario.password;
        this.otpRequired     = false;
      } catch(e) {
        console.error(e);
        this.showToast('Error guardando perfil','error');
      } finally {
        this.cargando = false;
      }
    }
  }
});
