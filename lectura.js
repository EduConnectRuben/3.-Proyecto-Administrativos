const elementosPermitidos = 'main h1, main h2, main h3, main p, main li:not(.icon), .celda-titulo, .celda-descripcion';
const textoElementos = Array.from(document.querySelectorAll(elementosPermitidos)).filter(el => {
    const texto = el.textContent.trim();
    const esIcono = el.classList.contains('icon') ||
                     /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]+$/u.test(texto);
    return !esIcono && texto.length > 0;
});

let index = 0;
let isPaused = false;
let isPlaying = false;
let currentUtterance = null;
let pauseTimeout = null;
let pauseTime = 0;
let startTime = 0;
const pauseResumeBtn = document.getElementById('pauseResume');

// Configuración de pausas
const pausaNumero = 300;   // 300ms después de números con punto (1. 2.)
const pausaPuntoFinal = 200; // 200ms después de puntos finales
const pausaNormal = 150;   // 150ms entre frases
const pausaParentesisCierre = 200; // 200ms después de )
const pausaDosPuntos = 200;        // 200ms después de :
const pausaGuion = 150;            // 150ms después de -
const pausaComillasCierre = 200;   // 200ms después de "
const pausaYO = 100;               // 100ms para "y/o"

function procesarTextoConPausas(texto) {
    let textoConPausas = texto
        // Casos especiales para dos puntos con paréntesis
        .replace(/\(\s*:\s*\)/g, '()[[pausa=150]]')  // Para (:) o ( : )
        .replace(/:\s*\(/g, '[[pausa=200]](')         // Para texto:(
        // Eliminar puntos finales (no en números o abreviaturas)
        .replace(/([a-zA-Z\u00C0-\u00FF])\.(?=\s|$)/g, '$1[[pausa=200]]')
        // Eliminar dos puntos generales (excepto en URLs y horas)
        .replace(/:(?!\/\/)(?!\d{1,2})/g, '[[pausa=200]]')
        // Pausa para números con punto (1. 2.)
        .replace(/(\d+\.)(\s+)/g, `$1[[pausa=${pausaNumero}]]$2`)
        // Reemplazar "y/o" por "o" con pausa
        .replace(/(y\/o)/gi, `o[[pausa=${pausaYO}]]`)
        // Pausa después de paréntesis de cierre )
        .replace(/\)(\s*)/g, `)[[pausa=${pausaParentesisCierre}]]$1`)
        // Pausa después de guiones
        .replace(/-\s+/g, `-[[pausa=${pausaGuion}]]`)
        // Pausa después de comillas de cierre "
        .replace(/"(\s*)/g, `"[[pausa=${pausaComillasCierre}]]$1`)
        // Pausa normal entre frases (para comas, punto y coma)
        .replace(/([.,;])(\s+)/g, `$1[[pausa=${pausaNormal}]]$2`);

    return textoConPausas;
}

function limpiarTexto(texto) {
    let textoProcesado = texto
        .replace(/^[📌🔹🎯✅⚠️]+/, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Expansión de abreviaturas
    textoProcesado = textoProcesado
        .replace(/\bu\.\s*e\./gi, 'Unidad Educativa')
        .replace(/\bc\.p\.e\./gi, 'Constitución Política del Estado')
        .replace(/\bcpe\b/gi, 'Constitución Política del Estado')
        .replace(/\brr\.\s*hh\./gi, 'Recursos Humanos')
        .replace(/\brrhh\b/gi, 'Recursos Humanos')
        .replace(/\bminedu\b/gi, 'Ministerio de Educación')
        .replace(/\bd\.d\.e\./gi, 'Dirección Departamental de Educación')
        .replace(/\bdde\b/gi, 'Dirección Departamental de Educación')
        .replace(/\br\.m\./gi, 'Resolución Ministerial')
        .replace(/\bd\.s\./gi, 'Decreto Supremo')
        .replace(/\bprof\./gi, 'Profesor')
        .replace(/\bprofa\./gi, 'Profesora')
        .replace(/\bNº\b/gi, 'Número')
        .replace(/\bArt\b\./gi, 'Artículo')
        .replace(/\bArt-(\d+)\b/gi, 'Artículo $1')
        .replace(/\bPág\b\./gi, 'Página')
        .replace(/\bEj\b\./gi, 'Ejemplo')
        .replace(/\bDr\b\./gi, 'Doctor')
        .replace(/\bDra\b\./gi, 'Doctora')
        .replace(/\bC\b\//gi, 'Calle')
        .replace(/\bS\/N\b/gi, 'Sin Número')
        .replace(/\bEtc\b\./gi, 'Etcétera')
        .replace(/\bAprox\b\./gi, 'Aproximadamente');

    return textoProcesado;
}

function leerConPausas(texto) {
    const fragmentos = texto.split(/(\[\[pausa=\d+\]\])/);
    let indiceFragmento = 0;
    
    function leerSiguienteFragmento() {
        if (indiceFragmento >= fragmentos.length) {
            return Promise.resolve();
        }
        
        const fragmento = fragmentos[indiceFragmento];
        const esPausa = fragmento.startsWith('[[pausa=');
        
        if (esPausa) {
            const duracion = parseInt(fragmento.match(/\d+/)[0], 10);
            return new Promise(resolve => {
                setTimeout(() => {
                    indiceFragmento++;
                    leerSiguienteFragmento().then(resolve);
                }, duracion);
            });
        } else {
            if (fragmento.trim().length > 0) {
                return new Promise(resolve => {
                    const utterance = new SpeechSynthesisUtterance(fragmento);
                    utterance.lang = 'es-ES';
                    utterance.onend = () => {
                        indiceFragmento++;
                        leerSiguienteFragmento().then(resolve);
                    };
                    currentUtterance = utterance;
                    speechSynthesis.speak(utterance);
                });
            } else {
                indiceFragmento++;
                return leerSiguienteFragmento();
            }
        }
    }
    
    return leerSiguienteFragmento();
}

function actualizarIconoPausa() {
    if (pauseResumeBtn) {
        pauseResumeBtn.innerHTML = isPaused ? 
            '<i class="fas fa-play icon"></i>' : 
            '<i class="fas fa-pause icon"></i>';
    }
}

async function leerTexto() {
    if (index >= textoElementos.length) {
        resetearReproduccion();
        return;
    }

    const elementoActual = textoElementos[index];
    const textoLimpio = limpiarTexto(elementoActual.textContent);
    
    if (!textoLimpio) {
        index++;
        await leerTexto();
        return;
    }

    // Resaltado y scroll
    textoElementos.forEach(el => el.classList.remove('resaltado'));
    elementoActual.classList.add('resaltado');
    elementoActual.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Configurar estado
    startTime = Date.now();
    isPlaying = true;
    isPaused = false;
    actualizarIconoPausa();

    try {
        const textoConPausas = procesarTextoConPausas(textoLimpio);
        await leerConPausas(textoConPausas);
        
        if (!isPaused && isPlaying) {
            elementoActual.classList.remove('resaltado');
            index++;
            await leerTexto();
        }
    } catch (error) {
        console.error("Error en lectura:", error);
        avanzarSiguiente();
    }
}

function resetearReproduccion() {
    index = 0;
    isPlaying = false;
    isPaused = false;
    textoElementos.forEach(el => el.classList.remove('resaltado'));
    actualizarIconoPausa();
}

function pausarReproduccion() {
    if (!isPlaying || isPaused) return;
    
    speechSynthesis.cancel();
    pauseTime = Date.now() - startTime;
    isPaused = true;
    isPlaying = false;
    actualizarIconoPausa();
}

async function reanudarReproduccion() {
    if (!isPaused) return;
    
    const elementoActual = textoElementos[index];
    const textoLimpio = limpiarTexto(elementoActual.textContent);
    const palabras = textoLimpio.split(/\s+/);
    const palabrasReanudar = Math.floor(pauseTime / 150); // Estimación 150ms por palabra
    
    const textoReanudar = palabras.slice(Math.max(0, palabrasReanudar - 1)).join(' ');
    const textoConPausas = procesarTextoConPausas(textoReanudar);

    // Configurar estado
    isPaused = false;
    isPlaying = true;
    elementoActual.classList.add('resaltado');
    actualizarIconoPausa();

    try {
        await leerConPausas(textoConPausas);
        
        if (!isPaused && isPlaying) {
            elementoActual.classList.remove('resaltado');
            index++;
            await leerTexto();
        }
    } catch (error) {
        console.error("Error al reanudar:", error);
        avanzarSiguiente();
    }
}

function avanzarSiguiente() {
    textoElementos[index]?.classList.remove('resaltado');
    index++;
    if (index < textoElementos.length) {
        leerTexto();
    } else {
        resetearReproduccion();
    }
}

// Event Listeners
document.getElementById('play')?.addEventListener('click', () => {
    if (!isPlaying) {
        speechSynthesis.cancel();
        index = 0;
        leerTexto();
    }
});

pauseResumeBtn?.addEventListener('click', () => {
    if (isPaused) {
        reanudarReproduccion();
    } else {
        pausarReproduccion();
    }
});

document.getElementById('next')?.addEventListener('click', () => {
    speechSynthesis.cancel();
    isPlaying = true;
    isPaused = false;
    textoElementos[index]?.classList.remove('resaltado');
    index = Math.min(index + 1, textoElementos.length - 1);
    leerTexto();
});

document.getElementById('prev')?.addEventListener('click', () => {
    speechSynthesis.cancel();
    isPlaying = true;
    isPaused = false;
    textoElementos[index]?.classList.remove('resaltado');
    index = Math.max(index - 1, 0);
    leerTexto();
});

document.getElementById('stop')?.addEventListener('click', () => {
    speechSynthesis.cancel();
    resetearReproduccion();
});

// Verificar compatibilidad al cargar
if (!('speechSynthesis' in window)) {
    console.warn('La síntesis de voz no es compatible con este navegador');
}
