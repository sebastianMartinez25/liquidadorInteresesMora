# Límites de Google Apps Script como Backend con Google Sheets

## Resumen Ejecutivo

Google Apps Script es una plataforma poderosa para crear aplicaciones backend con Google Sheets como base de datos. Sin embargo, tiene límites específicos que debes conocer para planificar correctamente tu aplicación.

## Límites de Google Sheets (Base de Datos)

### Límites Principales
- **10 millones de celdas** por spreadsheet (incluye celdas vacías)
- **40,000 nuevas filas** máximo por operación
- **200 pestañas** por libro de trabajo
- **18,278 columnas** máximo (hasta la columna ZZZ)
- **50,000 caracteres** por celda
- **5,000 caracteres** en columnas LongText

### Límites de Rendimiento
- **100K filas máximo** para tablas pivot en Connected Sheets
- **500K filas o 5M celdas** para extracts en Connected Sheets
- **1,000 fórmulas GoogleFinance** por spreadsheet
- **50 fórmulas ImportRange** por spreadsheet
- **50 funciones** de ImportData, ImportHtml, ImportFeed, ImportXml

## Límites de Google Apps Script (Backend)

### Límites de Ejecución
- **6 minutos** por ejecución (límite fijo)
- **Tiempo transcurrido** (no tiempo de computación)
- Los triggers ejecutan con prioridad reducida

### Límites Diarios por Tipo de Cuenta

#### Cuenta Gratuita (@gmail.com)
- **Eventos de Calendar:** 5,000 por día
- **Contactos creados:** 1,000 por día
- **Documentos creados:** 250 por día
- **Destinatarios de email:** 100 por día
- **Spreadsheets creados:** 250 por día
- **Llamadas URLFetch:** 20,000 por día
- **Datos URLFetch:** 100 MB por día
- **Tiempo total de triggers:** 1 hora por día

#### Google Workspace Business/Education
- **Eventos de Calendar:** 10,000 por día
- **Contactos creados:** 2,000 por día
- **Documentos creados:** 1,500 por día
- **Destinatarios de email:** 1,500 por día
- **Spreadsheets creados:** 3,200 por día
- **Llamadas URLFetch:** 100,000 por día
- **Datos URLFetch:** 100 MB por día
- **Tiempo total de triggers:** 6 horas por día

### Límites por Operación
- **Tamaño de email:** 25 MB por mensaje
- **Cuerpo de email:** 200-400 KB por mensaje
- **Destinatarios por email:** 50 por mensaje
- **Adjuntos por email:** 250 por mensaje
- **Triggers:** 20 por usuario por script
- **Propiedades:** 500 KB total, 9 KB por valor
- **URLFetch POST:** 10 MB por llamada
- **URLFetch headers:** 8 KB por llamada

## Casos de Uso Recomendados

### ✅ Casos Ideales
- **Aplicaciones pequeñas a medianas** (<50,000 registros)
- **Prototipos y MVP** rápidos
- **Automatización interna** de procesos
- **Dashboards simples** y reportes
- **Formularios y encuestas** con procesamiento básico
- **Notificaciones automáticas** por email
- **Integraciones simples** entre Google Workspace

### ⚠️ Casos con Limitaciones
- **Aplicaciones con muchos usuarios** simultáneos
- **Procesamiento de archivos grandes** (>10MB)
- **Operaciones en tiempo real** críticas
- **Análisis de datos complejos** con muchas fórmulas
- **Aplicaciones con alta concurrencia**

### ❌ Casos No Recomendados
- **Aplicaciones de producción** con miles de usuarios
- **Procesamiento de Big Data** (>1M registros)
- **Aplicaciones críticas** que requieren 99.9% uptime
- **Sistemas transaccionales** complejos
- **Aplicaciones que requieren** procesamiento continuo >6 minutos

## Estrategias para Optimizar el Uso

### 1. Gestión de Datos
```javascript
// Leer datos en lotes
function leerDatosEnLotes() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const batchSize = 1000;
  let startRow = 2;
  
  while (true) {
    const data = sheet.getRange(startRow, 1, batchSize, 10).getValues();
    if (data.length === 0) break;
    
    // Procesar lote
    procesarLote(data);
    
    startRow += batchSize;
    Utilities.sleep(100); // Evitar rate limits
  }
}
```

### 2. Manejo de Cuotas
```javascript
// Implementar exponential backoff
function exponentialBackoff(func, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return func();
    } catch (error) {
      if (error.message.includes('rate limit') && i < maxRetries - 1) {
        Utilities.sleep(Math.pow(2, i) * 1000 + Math.random() * 1000);
      } else {
        throw error;
      }
    }
  }
}
```

### 3. Cacheo de Datos
```javascript
// Usar PropertiesService para cachear
function obtenerDatosConCache(key) {
  const cache = PropertiesService.getScriptProperties();
  let data = cache.getProperty(key);
  
  if (!data) {
    data = obtenerDatosDeFuente();
    cache.setProperty(key, JSON.stringify(data));
  } else {
    data = JSON.parse(data);
  }
  
  return data;
}
```

### 4. Dividir Procesos
```javascript
// Usar triggers para procesos largos
function procesoLargo() {
  const startTime = new Date();
  const maxTime = 5 * 60 * 1000; // 5 minutos
  
  while (new Date() - startTime < maxTime) {
    // Procesar elementos
    if (queue.length === 0) break;
    
    procesarElemento(queue.shift());
  }
  
  // Si queda trabajo, programar continuación
  if (queue.length > 0) {
    ScriptApp.newTrigger('procesoLargo')
      .timeBased()
      .after(60000) // 1 minuto después
      .create();
  }
}
```

## Alternativas Cuando Superas los Límites

### Cuando Google Sheets no es Suficiente
- **AppSheet:** Para aplicaciones no-code más robustas
- **Google Cloud SQL:** Para bases de datos relacionales
- **Google BigQuery:** Para análisis de grandes volúmenes
- **Google Firebase:** Para aplicaciones web/móviles

### Cuando Apps Script no es Suficiente
- **Google Cloud Functions:** Para lógica serverless más robusta
- **Google Cloud Run:** Para aplicaciones containerizadas
- **Google App Engine:** Para aplicaciones web completas
- **Google Compute Engine:** Para control total del servidor

## Monitoreo y Alertas

### Monitorear Cuotas
```javascript
function monitorearCuotas() {
  const properties = PropertiesService.getScriptProperties();
  const today = new Date().toDateString();
  
  // Contar operaciones diarias
  let emailsSent = parseInt(properties.getProperty('emails_' + today) || '0');
  
  if (emailsSent > 80) { // 80% del límite gratuito
    Logger.log('Alerta: Cerca del límite de emails diarios');
  }
  
  // Actualizar contador
  properties.setProperty('emails_' + today, (emailsSent + 1).toString());
}
```

### Alertas de Rendimiento
```javascript
function alertaRendimiento() {
  const startTime = new Date();
  
  // Tu código aquí
  
  const executionTime = new Date() - startTime;
  
  if (executionTime > 300000) { // 5 minutos
    Logger.log('Alerta: Ejecución cerca del límite de tiempo');
  }
}
```

## Mejores Prácticas

1. **Diseña para los límites** desde el principio
2. **Usa cacheo** para reducir llamadas a APIs
3. **Implementa retry logic** para manejar rate limits
4. **Divide procesos largos** en multiple ejecuciones
5. **Monitorea el uso** de cuotas regularmente
6. **Optimiza consultas** a Google Sheets
7. **Usa batch operations** cuando sea posible
8. **Implementa logging** para debugging

## Conclusión

Google Apps Script con Google Sheets es excelente para aplicaciones pequeñas a medianas, pero requiere cuidadosa planificación para manejar los límites. Para aplicaciones más grandes o críticas, considera migrar a Google Cloud Platform u otras alternativas más robustas.

### Capacidades Estimadas por Tipo de Aplicación

| Tipo de Aplicación | Usuarios Concurrentes | Registros | Transacciones/día |
|---|---|---|---|
| Prototipo/MVP | 1-5 | <1,000 | <1,000 |
| Aplicación Interna | 5-20 | 1,000-10,000 | 1,000-10,000 |
| Aplicación Departamental | 20-50 | 10,000-50,000 | 10,000-50,000 |
| Aplicación Empresarial | 50+ | 50,000+ | 50,000+ |

**Recomendación:** Para aplicaciones empresariales, migra a Google Cloud Platform o considera alternativas más robustas.