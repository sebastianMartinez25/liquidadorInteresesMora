Vue.component('sidebar', {
  template: `
    <aside class="sidebar" :class="{ open: abierto }">
      <!-- Botón cerrar (sólo visible en móvil) -->
      <button class="btn-close" v-if="isMobile" @click="toggleSidebar">×</button>

      <div class="logo">
        <img src="images/logo.png" alt="Logo" />
      </div>
<nav>
  <a href="index.html" :class="{ active: paginaActual === 'index.html' }">
    <i class="fas fa-home"></i> Inicio
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
          <a href="perfil.html">Perfil</a>
          <a href="#" @click.prevent="cerrarSesion">Cerrar sesión</a>
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
      const email = localStorage.getItem('userEmail') || 'desconocido';
        const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Log de fin de sesión
   if (typeof logSessionEvent === 'function') {
          await logSessionEvent(email, 'FIN_SESION', zona);
        }
        localStorage.removeItem('auth'); // Elimina la autenticación
        localStorage.removeItem('userEmail');
        window.location.href = 'login.html'; // Redirige al login
    },
    toggleSidebar() {
      this.$root.abierto = !this.$root.abierto;
      document.body.classList.toggle('sidebar-open', this.$root.abierto);
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
    },
    cerrarSidebar() {
      this.abierto = false;
      document.body.classList.remove('sidebar-open');
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

    // Detectar tamaño para saber si es móvil
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth < 768;
    });

    // Control de inactividad
    const tiempoInactividad = 90000; // 15 minutos
    let timeout;
    const resetearTiempo = () => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        const email = localStorage.getItem('userEmail') || 'desconocido';
        const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (typeof logSessionEvent === 'function') {
          await logSessionEvent(email, 'FIN_SESION', zona);
        }
        
        localStorage.removeItem('auth');
        localStorage.removeItem('userEmail');
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
