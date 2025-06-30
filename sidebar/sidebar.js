Vue.component('sidebar', {
  template: `
    <aside class="sidebar" :class="{ open: abierto }">
      <!-- Botón cerrar (sólo visible en móvil) -->
      <button class="btn-close" v-if="abierto" @click="toggleSidebar"> <i class="fa fa-window-close"></i></button>

      <div class="logo">
        <img src="images/logo.png" alt="Logo" />
      </div>
<nav>
  <a href="index.html" :class="{ active: paginaActual === 'index.html' }">
    <i class="fas fa-home"></i> Inicio
  </a>
  <a href="dashboard.html" :class="{ active: paginaActual === 'dashboard.html' }">
    <i class="fa-solid fa-chart-simple"></i> Métricas
  </a>
  <a href="processes.html" :class="{ active: paginaActual === 'processes.html' }">
    <i class="fa-solid fa-box-archive"></i> Procesos
  </a>
  <a href="alerts.html" :class="{ active: paginaActual === 'alerts.html' }">
    <i class="fa-solid fa-bell"></i> Alertas
  </a>
  <a href="perfil.html" :class="{ active: paginaActual === 'perfil.html' }">
    <i class="fas fa-user"></i> Perfil
  </a>
  <a href="planes.html" :class="{ active: paginaActual === 'planes.html' }">
    <i class="fas fa-credit-card"></i> Planes
  </a>
</nav>


      <div class="usuario" @click="mostrarOp = !mostrarOp">
        <i class="fas fa-user-circle"></i>
        <span>{{ correo }}</span>
        <div class="opciones" v-if="mostrarOp">
          <a href="perfil.html"><i class="fas fa-user"></i> Perfil</a>
          <a href="#" @click.prevent="cerrarSesion"><i class="fa fa-sign-out"></i> Cerrar sesión</a>
        </div>
      </div>
    </aside>
  `,
  data() {
    return {
      correo: localStorage.getItem('userEmail') || 'usuario@ejemplo.com',
      mostrarOp: false,
       paginaActual: ''
    };
  },
  mounted() {
  this.paginaActual = window.location.pathname.split('/').pop(); // Ej: index.html
},

  computed: {
    abierto() {
      return this.$root.abierto;
    },
    isMobile() {
      return this.$root.isMobile;
    }
  },
  methods: {
    async cerrarSesion() {
      const overlay = document.getElementById('spinner-overlay');
  if (overlay) overlay.style.display = 'flex';

       this.mostrarToast('Cerrando sesión...', 'info');
      const email = localStorage.getItem('userEmail') || 'desconocido';
        const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Log de fin de sesión
   if (typeof logSessionEvent === 'function') {
          await logSessionEvent(email, 'FIN_SESION', zona);
        }
        localStorage.removeItem('auth'); // Elimina la autenticación
        localStorage.removeItem('userEmail');
        
      if (overlay) overlay.style.display = 'none';
    window.location.href = 'login.html';
  
    },
    mostrarToast(msg, tipo = 'info') {
      const container = document.getElementById('toast-container') || this.crearToastContainer();
      const toast = document.createElement('div');
      toast.className = `toast ${tipo}`;
      toast.innerText = msg;
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    },
    crearToastContainer() {
      const div = document.createElement('div');
      div.id = 'toast-container';
      div.className = 'toast-container';
      document.body.appendChild(div);
      return div;
    },
    toggleSidebar() {
      this.$root.abierto = !this.$root.abierto;
      document.body.classList.toggle('sidebar-open', this.$root.abierto);

      // Mostrar/ocultar botones
      const toggleBtn = document.querySelector('.btn-toggle');
      const closeBtn = document.querySelector('.btn-close');
      if (toggleBtn) toggleBtn.style.display = this.$root.abierto ? 'none' : 'block';
      if (closeBtn) closeBtn.style.display = this.$root.abierto ? 'block' : 'none';
    }
  }
});

const sidebarApp = new Vue({
  el: '#sidebar-root',
  data: {
    abierto: true, // Siempre visible por defecto
    isMobile: window.innerWidth < 768
  },
  methods: {
    toggleSidebar() {
      this.abierto = !this.abierto;
      document.body.classList.toggle('sidebar-open', this.abierto);

      const toggleBtn = document.querySelector('.btn-toggle');
      const closeBtn = document.querySelector('.btn-close');
      if (toggleBtn) toggleBtn.style.display = this.abierto ? 'none' : 'block';
      if (closeBtn) closeBtn.style.display = this.abierto ? 'block' : 'none';
    },
    cerrarSidebar() {
      this.abierto = false;
      document.body.classList.remove('sidebar-open');
       const toggleBtn = document.querySelector('.btn-toggle');
      const closeBtn = document.querySelector('.btn-close');
      if (toggleBtn) toggleBtn.style.display = 'block';
      if (closeBtn) closeBtn.style.display = 'none';
    }
  },
  created() {
    // Validar autenticación
    if (localStorage.getItem('auth') !== 'true') {
      window.location.href = 'login.html';
    }

    // Mostrar sidebar si es escritorio
    this.abierto = window.innerWidth >= 768;
    document.body.classList.toggle('sidebar-open', this.abierto);

   const toggleBtn = document.querySelector('.btn-toggle');
    const closeBtn = document.querySelector('.btn-close');
    if (toggleBtn) toggleBtn.style.display = this.abierto ? 'none' : 'block';
    if (closeBtn) closeBtn.style.display = this.abierto ? 'block' : 'none';

    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth < 768;
    });

    // Control de inactividad
    const tiempoInactividad = 900000; // 15 minutos
    let timeout;
    const resetearTiempo = () => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        const overlay = document.getElementById('spinner-overlay');
  if (overlay) overlay.style.display = 'flex';

       
        const email = localStorage.getItem('userEmail') || 'desconocido';
        const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // 🔥 Aquí accedemos al método del componente
    if (window.$sidebarVm && window.$sidebarVm.$children.length) {
      const vm = window.$sidebarVm.$children[0];
      vm.mostrarToast('Cerrando sesión por inactividad...', 'info');
    }
        if (typeof logSessionEvent === 'function') {
          await logSessionEvent(email, 'FIN_SESION', zona);
        }
        
        localStorage.removeItem('auth');
        localStorage.removeItem('userEmail');

        if (overlay) overlay.style.display = 'none';
     
        window.location.href = 'login.html';
      }, tiempoInactividad);
    };

    window.onload = resetearTiempo;
    document.onmousemove = resetearTiempo;
    document.onkeydown = resetearTiempo;
    document.ontouchstart = resetearTiempo;
    document.onclick = resetearTiempo;
document.onscroll = resetearTiempo;
  }
});

window.$sidebarVm = sidebarApp;

document.addEventListener('click', function(e) {
  const usuario = document.querySelector('.sidebar .usuario');
  const opciones = document.querySelector('.sidebar .usuario .opciones');

  if (usuario && opciones && !usuario.contains(e.target)) {
    const vueComp = window.$sidebarVm.$children[0];
    vueComp.mostrarOp = false;
  }
});