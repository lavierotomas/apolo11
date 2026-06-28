// ============================================================================
// 1. STARFIELD BACKGROUND (Mantenido del original)
// ============================================================================
const canvas = document.getElementById('stars-canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const stars = Array.from({ length: 220 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: Math.random() * 1.3 + 0.2,
  a: Math.random(),
  speed: Math.random() * 0.004 + 0.001,
  phase: Math.random() * Math.PI * 2
}));

let frame = 0;
function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  frame += 0.01;
  stars.forEach(s => {
    const alpha = s.a * (0.6 + 0.4 * Math.sin(frame * s.speed * 30 + s.phase));
    ctx.beginPath();
    ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 215, 255, ${alpha})`;
    ctx.fill();
  });
  requestAnimationFrame(drawStars);
}
drawStars();

// ============================================================================
// 2. SCROLL REVEAL Y BIBLIOGRAFÍA (Mantenido del original)
// ============================================================================
const reveals = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.1 });
reveals.forEach(el => io.observe(el));

function toggleBiblio(id) {
  const el = document.getElementById(id);
  el.classList.toggle('open');
  const btn = el.previousElementSibling;
  btn.textContent = el.classList.contains('open') ? '📚 Cerrar Bibliografía' : '📚 Ver Bibliografía';
}

// Video scroll autoplay original
(function () {
  const wrap = document.getElementById('kennedyVideo');
  const vid = document.getElementById('kennedyVideoTag');
  if (!wrap || !vid) return;

  const soundBtn = document.getElementById('kennedySoundToggle');
  const playCenter = document.getElementById('kennedyPlayCenter');
  let triedAutoplay = false;

  function attemptPlay() {
    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          wrap.classList.add('is-playing');
        })
        .catch(() => {
          wrap.classList.remove('is-playing');
        });
    }
  }

  playCenter.addEventListener('click', function () {
    attemptPlay();
  });

  vid.addEventListener('playing', function () {
    wrap.classList.add('is-playing');
  });

  vid.addEventListener('pause', function () {
    wrap.classList.remove('is-playing');
  });

  soundBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    vid.muted = !vid.muted;
    soundBtn.textContent = vid.muted ? '🔇 Activar sonido' : '🔊 Sonido activado';
  });

  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      // Solo autoplay si NO estamos en modo juego
      if (document.body.classList.contains('game-mode-active')) {
        vid.pause();
        return;
      }
      if (entry.isIntersecting) {
        if (!triedAutoplay) {
          triedAutoplay = true;
          attemptPlay();
        } else if (vid.paused) {
          attemptPlay();
        }
      } else {
        if (!vid.paused) vid.pause();
      }
    });
  }, { threshold: 0.5 });

  videoObserver.observe(wrap);
})();

// ============================================================================
// 3. SINTETIZADOR DE SONIDO RETRO (Web Audio API)
// ============================================================================
const SoundSynth = {
  ctx: null,
  muted: false,
  engineNode: null,
  engineGain: null,

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API no soportado en este navegador.");
    }
  },

  playBeep(freq = 800, duration = 0.08, type = 'sine', volume = 0.12) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  playClick() {
    this.playBeep(900, 0.03, 'triangle', 0.08);
  },

  playSuccess() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    const playNote = (freq, time, dur) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      gain.connect(this.ctx.destination);
      osc.connect(gain);
      gain.gain.setValueAtTime(0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      osc.start(time);
      osc.stop(time + dur);
    };

    playNote(523.25, now, 0.12); // C5
    playNote(659.25, now + 0.10, 0.12); // E5
    playNote(783.99, now + 0.20, 0.12); // G5
    playNote(1046.50, now + 0.30, 0.35); // C6
  },

  playFail() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    const playNote = (freq, time, dur) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);
      gain.connect(this.ctx.destination);
      osc.connect(gain);
      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      osc.start(time);
      osc.stop(time + dur);
    };

    playNote(220.00, now, 0.18); // A3
    playNote(146.83, now + 0.12, 0.35); // D3
  },

  startEngine() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || this.engineNode) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.015 * white)) / 1.015; // Low-pass filter effect
      lastOut = data[i];
      data[i] *= 4.0; // Boost
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    noise.start();
    this.engineNode = noise;
  },

  stopEngine() {
    if (this.engineNode) {
      try {
        this.engineNode.stop();
      } catch (e) {}
      this.engineNode = null;
      this.engineGain = null;
    }
  }
};

// ============================================================================
// 4. SISTEMA GENERAL DEL JUEGO (GAME CONTROLLER)
// ============================================================================
const GameController = {
  currentStage: 1,
  score: 0,
  fuel: 100,
  oxygen: 100,
  oxygenInterval: null,
  gameTime: 0,
  gameTimeInterval: null,
  isAudioInit: false,
  
  // Elementos DOM
  btnToggle: document.getElementById('mode-toggle-btn'),
  muralContainer: document.getElementById('mural-container'),
  consoleContainer: document.getElementById('console-container'),
  btnAbort: document.getElementById('abort-mission-btn'),
  btnMute: document.getElementById('sound-mute-btn'),
  
  init() {
    // Escuchar toggle de modo
    this.btnToggle.addEventListener('click', () => this.toggleMode());
    this.btnAbort.addEventListener('click', () => this.abortMission());
    
    // Listeners para el Overlay de Elección Inicial
    const overlay = document.getElementById('choice-overlay');
    const btnInfo = document.getElementById('btn-mode-info');
    const btnGame = document.getElementById('btn-mode-game');

    if (btnInfo && overlay) {
      btnInfo.addEventListener('click', () => {
        SoundSynth.init();
        SoundSynth.playClick();
        overlay.classList.add('hidden');
        this.logMessage('MODO INFORMATIVO SELECCIONADO.');
      });
    }

    if (btnGame && overlay) {
      btnGame.addEventListener('click', () => {
        SoundSynth.init();
        overlay.classList.add('hidden');
        this.toggleMode(); // Activa el modo juego directamente
      });
    }

    // Mute botón
    this.btnMute.addEventListener('click', () => {
      SoundSynth.muted = !SoundSynth.muted;
      this.btnMute.textContent = SoundSynth.muted ? '🔇 SILENCIADO' : '🔊 SONIDO';
      SoundSynth.playClick();
    });

    // Delegar clicks en etapas laterales para navegación una vez desbloqueadas
    document.querySelectorAll('.stage-indicator-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const stageNum = parseInt(item.getAttribute('data-stage'));
        if (!item.classList.contains('locked')) {
          SoundSynth.playClick();
          this.loadStage(stageNum);
        }
      });
    });
  },

  toggleMode() {
    if (!this.isAudioInit) {
      SoundSynth.init();
      this.isAudioInit = true;
    }
    
    const isGameMode = this.consoleContainer.style.display !== 'none';
    
    if (!isGameMode) {
      // Entrar en modo juego
      document.body.classList.add('game-mode-active');
      this.muralContainer.style.display = 'none';
      this.consoleContainer.style.display = 'block';
      this.btnToggle.textContent = '📖 MURAL DE HISTORIA';
      
      // Mover el video de JFK a la consola para que no se pierda interactividad
      const videoWrap = document.getElementById('kennedyVideo');
      if (videoWrap) {
        // Guardamos su ubicación original
        this.originalVideoParent = videoWrap.parentNode;
        this.originalVideoSibling = videoWrap.nextSibling;
      }
      
      // Iniciar contadores y estado
      this.resetStats();
      this.loadStage(1);
      this.startCounters();
      
      this.logMessage('SISTEMA INICIALIZADO. SEÑAL ESTABLE EN ÓRBITA LUNAR.', 'success');
      this.logMessage('MISIÓN APOLO 11: CONTROLADOR LISTO.');
      SoundSynth.playBeep(440, 0.25, 'sine', 0.15);
    } else {
      // Salir de modo juego
      this.abortMission();
    }
  },

  abortMission() {
    SoundSynth.playFail();
    this.stopCounters();
    SoundSynth.stopEngine();
    
    document.body.classList.remove('game-mode-active');
    this.muralContainer.style.display = 'block';
    this.consoleContainer.style.display = 'none';
    this.btnToggle.textContent = '🕹️ INICIAR SIMULACIÓN';
    
    // Regresar el video a su sección original
    const videoWrap = document.getElementById('kennedyVideo');
    if (videoWrap && this.originalVideoParent) {
      this.originalVideoParent.insertBefore(videoWrap, this.originalVideoSibling);
    }
  },

  resetStats() {
    this.currentStage = 1;
    this.score = 0;
    this.fuel = 100;
    this.oxygen = 100;
    this.gameTime = 0;
    
    // UI Reset
    document.getElementById('telemetry-fuel').style.width = '100%';
    document.getElementById('telemetry-fuel').className = 'tel-bar';
    document.getElementById('telemetry-oxygen').textContent = '100%';
    document.getElementById('telemetry-oxygen').className = 'tel-value ok';
    document.getElementById('telemetry-score').textContent = '0000';
    document.getElementById('telemetry-v-speed').textContent = '0.0 m/s';
    document.getElementById('telemetry-alt').textContent = '---- m';
    
    // Reset indicators
    document.querySelectorAll('.stage-indicator-item').forEach((item, index) => {
      if (index === 0) {
        item.className = 'stage-indicator-item active';
        item.querySelector('.status-led').className = 'status-led yellow';
      } else {
        item.className = 'stage-indicator-item locked';
        item.querySelector('.status-led').className = 'status-led';
      }
    });

    // Limpiar logs
    document.getElementById('system-logs-content').innerHTML = `
      <p>> CONEXIÓN ESTABLECIDA CON CABO CAÑAVERAL.</p>
      <p>> INICIANDO SIMULACIÓN HISTÓRICA APOLO XI...</p>
    `;
  },

  startCounters() {
    this.stopCounters();
    
    // Decremento de Oxígeno lenta
    this.oxygenInterval = setInterval(() => {
      if (this.oxygen > 0) {
        this.oxygen--;
        const oxEl = document.getElementById('telemetry-oxygen');
        oxEl.textContent = `${this.oxygen}%`;
        
        if (this.oxygen <= 20) {
          oxEl.className = 'tel-value danger';
          if (this.oxygen % 5 === 0) {
            this.logMessage('ALERTA: RESERVAS DE OXÍGENO BAJAS.', 'danger');
            SoundSynth.playBeep(400, 0.3, 'sawtooth', 0.1);
          }
        } else if (this.oxygen <= 50) {
          oxEl.className = 'tel-value warning';
        }
      } else {
        this.logMessage('SOPORTE VITAL AGOTADO. MISIÓN ABORTADA.', 'danger');
        this.abortMission();
      }
    }, 3500);

    // Reloj de misión
    this.gameTimeInterval = setInterval(() => {
      this.gameTime++;
    }, 1000);
  },

  stopCounters() {
    clearInterval(this.oxygenInterval);
    clearInterval(this.gameTimeInterval);
  },

  logMessage(text, type = '') {
    const logsWrap = document.getElementById('system-logs-content');
    if (!logsWrap) return;
    
    const timeStr = new Date().toTimeString().split(' ')[0];
    const logPara = document.createElement('p');
    if (type) logPara.className = type;
    logPara.innerHTML = `&gt; [${timeStr}] ${text}`;
    
    logsWrap.appendChild(logPara);
    logsWrap.scrollTop = logsWrap.scrollHeight;
  },

  updateScore(points) {
    this.score += points;
    document.getElementById('telemetry-score').textContent = String(this.score).padStart(4, '0');
  },

  // CARGA DE ETAPAS / PANTALLAS
  loadStage(stageNum) {
    this.currentStage = stageNum;
    
    // Actualizar menú lateral
    document.querySelectorAll('.stage-indicator-item').forEach((item, index) => {
      const idxNum = index + 1;
      if (idxNum < stageNum) {
        item.className = 'stage-indicator-item completed';
        item.querySelector('.status-led').className = 'status-led';
      } else if (idxNum === stageNum) {
        item.className = 'stage-indicator-item active';
        item.querySelector('.status-led').className = 'status-led yellow';
      } else {
        // Solo bloquear si no ha sido completada previamente
        if (!item.classList.contains('completed')) {
          item.className = 'stage-indicator-item locked';
          item.querySelector('.status-led').className = 'status-led';
        }
      }
    });

    this.logMessage(`CARGANDO DATOS DE LA ETAPA ${stageNum}...`, 'system');

    // 1. Cargar documentación a la izquierda (Preservando todo el texto original)
    this.loadDocContent(stageNum);

    // 2. Cargar simulación/juego a la derecha
    this.loadSimContent(stageNum);
  },

  loadDocContent(stageNum) {
    const docBody = document.getElementById('doc-console-body');
    let sourceId = '';
    switch(stageNum) {
      case 1: sourceId = 'contexto'; break;
      case 2: sourceId = 'hecho'; break;
      case 3: sourceId = 'fuente'; break;
      case 4: sourceId = 'impacto'; break;
      case 5: sourceId = 'presente'; break;
    }

    const sourceSection = document.getElementById(sourceId);
    if (sourceSection) {
      // Clonar el contenido de la sección para no romper la sección mural original
      const title = sourceSection.querySelector('.section-title').outerHTML;
      const body = sourceSection.querySelector('.section-body').innerHTML;
      const biblio = sourceSection.querySelector('.biblio-section').outerHTML;
      
      docBody.innerHTML = `
        <div class="stage-doc-wrap">
          ${title}
          <div class="stage-doc-text">
            ${body}
          </div>
          ${biblio}
        </div>
      `;

      // Si es etapa 3 (JFK), mover físicamente el video hacia la consola
      if (stageNum === 3) {
        const consoleVideoPlaceholder = docBody.querySelector('.video-embed-wrap');
        const originalVideoWrap = document.getElementById('kennedyVideo');
        if (originalVideoWrap && consoleVideoPlaceholder) {
          // Reemplazamos el placeholder clonado en la consola con el objeto real que reproduce
          consoleVideoPlaceholder.parentNode.replaceChild(originalVideoWrap, consoleVideoPlaceholder);
        }
      }
    } else {
      docBody.innerHTML = `<p>Error al cargar documentación de etapa.</p>`;
    }
  },

  loadSimContent(stageNum) {
    const simBody = document.getElementById('sim-console-body');
    simBody.innerHTML = ''; // Limpiar
    
    // Nueva lógica: Archivo de Misión en lugar de mini-juegos
    this.initMissionArchive(simBody, stageNum);
  },

  // ============================================================================
  // ARCHIVO DE MISIÓN (MODO INTERACTIVO)
  // ============================================================================
  initMissionArchive(container, stageNum) {
    const archiveData = {
      1: {
        title: "LOS COMIENZOS: EL IMPACTO DEL SPUTNIK",
        image: "C:/Users/PC12-LabSec/.gemini/antigravity/brain/b6543e36-0374-44d9-be9a-16bc65da19e6/sputnik_1_space_race_1782230596224.png",
        desc: "Octubre 1957. El lanzamiento del Sputnik 1 por la URSS marcó el inicio de la era espacial y una crisis de seguridad en EE.UU.",
        hotspots: [
          { top: '30%', left: '50%', text: "Antenas de radio para transmitir el 'beep-beep' histórico." },
          { top: '60%', left: '52%', text: "Cuerpo de aluminio pulido de 58cm de diámetro." }
        ]
      },
      2: {
        title: "TRAYECTORIA HACIA LA LUNA: SATURN V",
        image: "C:/Users/PC12-LabSec/.gemini/antigravity/brain/b6543e36-0374-44d9-be9a-16bc65da19e6/apollo_11_launch_1782230610312.png",
        desc: "El gigante de 110 metros de altura impulsado por 5 motores F-1. El cohete más potente jamás construido.",
        hotspots: [
          { top: '80%', left: '50%', text: "Motores F-1: Consumían 15 toneladas de combustible por segundo." },
          { top: '20%', left: '50%', text: "Módulo de Comando en la cima del cohete." }
        ]
      },
      3: {
        title: "DESCENSO FINAL: EL MÓDULO 'EAGLE'",
        image: "C:/Users/PC12-LabSec/.gemini/antigravity/brain/b6543e36-0374-44d9-be9a-16bc65da19e6/lunar_module_eagle_1782230630080.png",
        desc: "Diseñado exclusivamente para operar en el vacío. Se separó del Columbia para llevar a Armstrong y Aldrin a la superficie.",
        hotspots: [
          { top: '40%', left: '45%', text: "Módulo de ascenso: donde viajaban los astronautas." },
          { top: '70%', left: '60%', text: "Tren de aterrizaje con sensores de contacto." }
        ]
      },
      4: {
        title: "CONTACTO: UN GRAN SALTO PARA LA HUMANIDAD",
        image: "C:/Users/PC12-LabSec/.gemini/antigravity/brain/b6543e36-0374-44d9-be9a-16bc65da19e6/moon_landing_first_step_1782230651066.png",
        desc: "20 de julio de 1969. La primera vez que un ser humano pisa otro mundo. Un momento que cambió la historia.",
        hotspots: [
          { top: '85%', left: '50%', text: "Suela de la bota: dejó una huella que durará millones de años." },
          { top: '30%', left: '48%', text: "Escalera del Módulo Lunar: 9 peldaños hacia la historia." }
        ]
      },
      5: {
        title: "LEGADO: TECNOLOGÍA EN CADA HOGAR",
        image: "apollo_11_net_com.jpg", // Placeholder or generic
        desc: "Desde el GPS hasta los materiales térmicos, el Apolo 11 vive en cada dispositivo moderno.",
        hotspots: [
          { top: '50%', left: '50%', text: "Microprocesadores: Antepasados de tu smartphone actual." }
        ]
      }
    };

    const data = archiveData[stageNum];
    if (!data) return;

    container.innerHTML = `
      <div class="mission-archive-wrap">
        <div class="archive-image-viewer">
          <div class="viewer-label">DOCUMENTO VISUAL #${stageNum} · CLASIFICADO</div>
          <img src="${data.image}" alt="${data.title}" onerror="this.src='https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=1000'">
          <div class="image-tech-overlay"></div>
          <div class="viewer-coords">COORD: ${Math.floor(Math.random()*90)}º${Math.floor(Math.random()*60)}'N / ${Math.floor(Math.random()*180)}º${Math.floor(Math.random()*60)}'W</div>
          
          ${data.hotspots.map(h => `
            <div class="hotspot" style="top: ${h.top}; left: ${h.left};">
              <div class="hotspot-tooltip">${h.text}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="archive-controls">
          <div class="archive-info">
            <strong>${data.title}</strong><br>
            <span>${data.desc}</span>
          </div>
          <div class="archive-nav-btns">
            <button class="archive-btn" id="archive-verify-btn">VERIFICAR REGISTRO</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('archive-verify-btn').addEventListener('click', () => {
      this.logMessage(`REGISTRO DE ETAPA ${stageNum} VERIFICADO Y CARGADO.`, 'success');
      this.unlockNextStage();
    });
  },

  // DESBLOQUEAR ETAPA SIGUIENTE
  unlockNextStage() {
    SoundSynth.playSuccess();
    this.updateScore(150);
    const next = this.currentStage + 1;
    
    if (next <= 5) {
      // Habilitar en la interfaz lateral
      const nextIndicator = document.getElementById(`stage-ind-${next}`);
      if (nextIndicator) {
        nextIndicator.classList.remove('locked');
        nextIndicator.classList.add('active');
      }
      
      this.logMessage(`¡ETAPA ${this.currentStage} COMPLETADA! ETAPA ${next} DESBLOQUEADA.`, 'success');
      
      // Cargar siguiente etapa automáticamente
      setTimeout(() => this.loadStage(next), 1200);
    } else {
      // ¡Victoria total! Misión completada
      this.logMessage(`¡FELICITACIONES! SE COMPLETARON TODAS LAS ETAPAS DE LA MISIÓN.`, 'success');
      setTimeout(() => this.showVictoryScreen(), 1500);
    }
  },

  showVictoryScreen() {
    this.stopCounters();
    SoundSynth.stopEngine();
    
    // Detener video si sigue sonando
    const vid = document.getElementById('kennedyVideoTag');
    if (vid) vid.pause();

    const simBody = document.getElementById('sim-console-body');
    
    // Calcular bonus
    const fuelBonus = Math.floor(this.fuel * 2.5);
    const oxygenBonus = Math.floor(this.oxygen * 1.5);
    const finalScore = this.score + fuelBonus + oxygenBonus;

    simBody.innerHTML = `
      <div class="console-victory-panel">
        <div class="victory-icon">🚀</div>
        <div class="victory-title">¡MISIÓN COMPLETADA!</div>
        <div class="victory-text">
          Has completado con éxito la simulación de la carrera espacial y el alunizaje del Apolo 11, recopilando y verificando toda la información histórica.
        </div>
        
        <div class="victory-stats">
          <div class="victory-stat-row">
            <span>PUNTOS BASE:</span>
            <span>${this.score}</span>
          </div>
          <div class="victory-stat-row">
            <span>BONUS COMBUSTIBLE (x2.5):</span>
            <span>+${fuelBonus}</span>
          </div>
          <div class="victory-stat-row">
            <span>BONUS OXÍGENO (x1.5):</span>
            <span>+${oxygenBonus}</span>
          </div>
          <div class="victory-stat-row" style="font-weight: bold; border-top: 1px dashed #33ff33; padding-top: 5px; margin-top: 5px;">
            <span>PUNTAJE FINAL DE VUELO:</span>
            <span style="color:#00c8e0">${finalScore} PUNTOS</span>
          </div>
        </div>

        <button id="victory-exit-btn" class="chrono-verify-btn">REGRESAR AL MURAL HISTÓRICO</button>
      </div>
    `;

    document.getElementById('victory-exit-btn').addEventListener('click', () => {
      this.abortMission(); // Cierra el juego y vuelve al mural
    });

    SoundSynth.playSuccess();
  },

  // ============================================================================
  // MINI-JUEGOS POR ETAPA
  // ============================================================================

  // ----------------------------------------------------------------------------
  // MISIÓN 1: PUZZLE CRONOLÓGICO (Carrera Espacial)
  // ----------------------------------------------------------------------------
  initStage1Chrono(container) {
    const items = [
      { id: 'item-1', year: 'Oct 1957', title: 'Sputnik 1', desc: 'URSS lanza el primer satélite artificial de la historia.', order: 1 },
      { id: 'item-2', year: 'Nov 1957', title: 'Sputnik 2', desc: 'URSS envía al espacio a la perra Laika.', order: 2 },
      { id: 'item-3', year: 'Abr 1961', title: 'Vostok 1', desc: 'Yuri Gagarin se convierte en el primer ser humano en el espacio.', order: 3 },
      { id: 'item-4', year: 'May 1961', title: 'Mercury 3', desc: 'Alan Shepard realiza el primer vuelo espacial de EE.UU.', order: 4 }
    ];

    // Desordenar
    const scrambled = [...items].sort(() => Math.random() - 0.5);

    container.innerHTML = `
      <div class="chrono-game-container">
        <div class="game-desc-panel">
          <strong>MISIÓN 1: CRONOLOGÍA DE LA CARRERA ESPACIAL</strong><br>
          Ordena los hitos iniciales de la carrera espacial de más antiguo a más reciente (de arriba hacia abajo). Puedes arrastrar los elementos o usar las flechas.
        </div>
        <div class="chrono-list" id="chrono-items-list">
          ${scrambled.map(item => `
            <div class="chrono-item" draggable="true" data-id="${item.id}" data-order="${item.order}">
              <span class="item-drag-handle">☰</span>
              <div class="item-text-content">
                <strong>${item.title} (${item.year})</strong>
                <span>${item.desc}</span>
              </div>
              <div class="chrono-item-controls">
                <button class="btn-move btn-up" type="button">▲</button>
                <button class="btn-move btn-down" type="button">▼</button>
              </div>
            </div>
          `).join('')}
        </div>
        <button id="chrono-check-btn" class="chrono-verify-btn">VERIFICAR CRONOLOGÍA</button>
      </div>
    `;

    // Implementar lógica de Drag and Drop
    const listEl = document.getElementById('chrono-items-list');
    let draggingEl = null;

    listEl.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('chrono-item')) {
        draggingEl = e.target;
        e.target.classList.add('dragging');
      }
    });

    listEl.addEventListener('dragend', (e) => {
      if (e.target.classList.contains('chrono-item')) {
        e.target.classList.remove('dragging');
        draggingEl = null;
      }
    });

    listEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(listEl, e.clientY);
      if (afterElement == null) {
        listEl.appendChild(draggingEl);
      } else {
        listEl.insertBefore(draggingEl, afterElement);
      }
    });

    function getDragAfterElement(container, y) {
      const draggableElements = [...container.querySelectorAll('.chrono-item:not(.dragging)')];
      return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Soporte para botones arriba/abajo (accesibilidad y móvil)
    listEl.querySelectorAll('.btn-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const item = e.target.closest('.chrono-item');
        const prev = item.previousElementSibling;
        if (prev) {
          SoundSynth.playClick();
          listEl.insertBefore(item, prev);
        }
      });
    });

    listEl.querySelectorAll('.btn-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const item = e.target.closest('.chrono-item');
        const next = item.nextElementSibling;
        if (next) {
          SoundSynth.playClick();
          listEl.insertBefore(next, item);
        }
      });
    });

    // Botón de verificación
    document.getElementById('chrono-check-btn').addEventListener('click', () => {
      const itemsCurrentOrder = [...listEl.querySelectorAll('.chrono-item')];
      let correct = true;
      
      for (let i = 0; i < itemsCurrentOrder.length - 1; i++) {
        const currentOrder = parseInt(itemsCurrentOrder[i].getAttribute('data-order'));
        const nextOrder = parseInt(itemsCurrentOrder[i+1].getAttribute('data-order'));
        if (currentOrder > nextOrder) {
          correct = false;
          break;
        }
      }

      if (correct) {
        this.logMessage('SINCRO DE TIEMPO CORRECTA. SECUENCIA VERIFICADA.', 'success');
        this.unlockNextStage();
      } else {
        SoundSynth.playFail();
        this.logMessage('ERROR EN LA LÍNEA TEMPORAL. VERIFIQUE LAS FECHAS.', 'danger');
        
        // Efecto visual de fallo
        listEl.classList.add('blinking');
        setTimeout(() => listEl.classList.remove('blinking'), 1000);
      }
    });
  },

  // ----------------------------------------------------------------------------
  // MISIÓN 2: SIMULADOR DE ALUNIZAJE (Eagle Lander)
  // ----------------------------------------------------------------------------
  initStage2Lander(container) {
    container.innerHTML = `
      <div class="lander-game-container">
        <div class="game-desc-panel">
          <strong>MISIÓN 2: ALUNIZAJE EN EL MÓDULO LUNAR "EAGLE"</strong><br>
          Aterriza el módulo suavemente en la plataforma plana verde. <br>
          <strong>Controles:</strong> Flecha Arriba (Propulsor), Izquierda/Derecha (Rotar).
        </div>
        
        <canvas id="lander-canvas" width="480" height="360"></canvas>
        
        <div class="keys-hint">
          <span>▲ / W: Propulsión</span>
          <span>◄ ► / A D: Rotación</span>
        </div>

        <div class="mobile-controls">
          <button id="btn-rot-left" class="control-btn" type="button">◀ ROTAR IZQ</button>
          <button id="btn-thrust" class="control-btn" type="button">🔥 PROPULSOR</button>
          <button id="btn-rot-right" class="control-btn" type="button">ROTAR DER ▶</button>
        </div>
      </div>
    `;

    const canvasL = document.getElementById('lander-canvas');
    const ctxL = canvasL.getContext('2d');
    
    // Física del lander
    let l_x = 240;
    let l_y = 50;
    let l_vx = 0.5;
    let l_vy = 0.1;
    let l_angle = 0; // en grados, 0 = apuntando arriba
    let l_fuel = 100;
    let l_gravity = 0.015;
    let l_thrust = 0.038;
    let l_crashed = false;
    let l_landed = false;
    
    // Teclas
    const activeKeys = {};
    const handleKeydown = (e) => {
      if (['ArrowUp', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        activeKeys[e.code] = true;
      }
    };
    const handleKeyup = (e) => {
      if (['ArrowUp', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyD'].includes(e.code)) {
        activeKeys[e.code] = false;
      }
    };

    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('keyup', handleKeyup);

    // Controles táctiles móvil
    let touchThrust = false;
    let touchLeft = false;
    let touchRight = false;

    const tLeft = document.getElementById('btn-rot-left');
    const tThrust = document.getElementById('btn-thrust');
    const tRight = document.getElementById('btn-rot-right');

    if (tLeft) {
      tLeft.addEventListener('mousedown', () => touchLeft = true);
      tLeft.addEventListener('mouseup', () => touchLeft = false);
      tLeft.addEventListener('touchstart', (e) => { e.preventDefault(); touchLeft = true; });
      tLeft.addEventListener('touchend', () => touchLeft = false);
    }
    if (tThrust) {
      tThrust.addEventListener('mousedown', () => { touchThrust = true; SoundSynth.startEngine(); });
      tThrust.addEventListener('mouseup', () => { touchThrust = false; SoundSynth.stopEngine(); });
      tThrust.addEventListener('touchstart', (e) => { e.preventDefault(); touchThrust = true; SoundSynth.startEngine(); });
      tThrust.addEventListener('touchend', () => { touchThrust = false; SoundSynth.stopEngine(); });
    }
    if (tRight) {
      tRight.addEventListener('mousedown', () => touchRight = true);
      tRight.addEventListener('mouseup', () => touchRight = false);
      tRight.addEventListener('touchstart', (e) => { e.preventDefault(); touchRight = true; });
      tRight.addEventListener('touchend', () => touchRight = false);
    }

    // Terreno lunar estático con plataforma de aterrizaje
    // Plataforma entre X=180 y X=300 a una altura Y=310
    const terrainPoints = [
      { x: 0, y: 320 },
      { x: 80, y: 260 },
      { x: 150, y: 310 },
      { x: 180, y: 310 }, // Plataforma inicio
      { x: 300, y: 310 }, // Plataforma fin
      { x: 340, y: 280 },
      { x: 400, y: 330 },
      { x: 480, y: 290 }
    ];

    let checkEngineSoundState = false;
    let animationFrameId = null;

    // Loop de juego
    const updateLander = () => {
      if (l_crashed || l_landed) return;

      // 1. Física de rotación
      if (activeKeys['ArrowLeft'] || activeKeys['KeyA'] || touchLeft) {
        l_angle -= 1.8;
      }
      if (activeKeys['ArrowRight'] || activeKeys['KeyD'] || touchRight) {
        l_angle += 1.8;
      }

      // 2. Física de aceleración/empuje
      const isThrusting = (activeKeys['ArrowUp'] || activeKeys['KeyW'] || touchThrust) && l_fuel > 0;
      
      if (isThrusting) {
        l_fuel -= 0.15;
        this.fuel = Math.max(0, Math.floor(l_fuel));
        document.getElementById('telemetry-fuel').style.width = `${this.fuel}%`;
        
        if (this.fuel < 25) {
          document.getElementById('telemetry-fuel').className = 'tel-bar danger';
        } else if (this.fuel < 50) {
          document.getElementById('telemetry-fuel').className = 'tel-bar warning';
        }

        // Convertir ángulo a empuje vectorial (0 grados es hacia arriba)
        const rad = (l_angle * Math.PI) / 180;
        l_vx += Math.sin(rad) * l_thrust;
        l_vy -= Math.cos(rad) * l_thrust;

        if (!checkEngineSoundState) {
          SoundSynth.startEngine();
          checkEngineSoundState = true;
        }
      } else {
        if (checkEngineSoundState) {
          SoundSynth.stopEngine();
          checkEngineSoundState = false;
        }
      }

      // Gravedad
      l_vy += l_gravity;

      // Aplicar velocidad
      l_x += l_vx;
      l_y += l_vy;

      // Telemetría en vivo
      document.getElementById('telemetry-v-speed').textContent = `${(l_vy * 10).toFixed(1)} m/s`;
      const displayAlt = Math.max(0, Math.floor(310 - l_y - 12));
      document.getElementById('telemetry-alt').textContent = `${displayAlt} m`;
      
      const vSpeedEl = document.getElementById('telemetry-v-speed');
      if (l_vy * 10 > 12) {
        vSpeedEl.className = 'tel-value danger';
      } else if (l_vy * 10 > 6) {
        vSpeedEl.className = 'tel-value warning';
      } else {
        vSpeedEl.className = 'tel-value ok';
      }

      // 3. Colisiones y límites de pantalla
      // Limitar bordes horizontales con rebote
      if (l_x < 10) { l_x = 10; l_vx = -l_vx * 0.3; }
      if (l_x > 470) { l_x = 470; l_vx = -l_vx * 0.3; }

      // Verificar altura del terreno bajo la nave
      let groundY = 320;
      for (let i = 0; i < terrainPoints.length - 1; i++) {
        const p1 = terrainPoints[i];
        const p2 = terrainPoints[i+1];
        if (l_x >= p1.x && l_x <= p2.x) {
          // Interpolación lineal
          const ratio = (l_x - p1.x) / (p2.x - p1.x);
          groundY = p1.y + ratio * (p2.y - p1.y);
          break;
        }
      }

      // Altura del lander con sus patas
      if (l_y >= groundY - 14) {
        l_y = groundY - 14;
        SoundSynth.stopEngine();
        
        // Evaluar condiciones de aterrizaje en la plataforma verde (X entre 180 y 300)
        const onPlatform = l_x >= 180 && l_x <= 300;
        const speedOk = l_vy * 10 <= 12; // Velocidad de descenso baja
        const hSpeedOk = Math.abs(l_vx * 10) <= 6; // Velocidad horizontal baja
        const angleOk = Math.abs(l_angle) <= 12; // Angulo casi vertical

        if (onPlatform && speedOk && hSpeedOk && angleOk) {
          l_landed = true;
          this.updateScore(100);
          this.logMessage('CRITICAL TELEMETRY: ¡EL ÁGUILA HA ALUNIZADO!', 'success');
          this.logMessage('NEIL ARMSTRONG: "Un pequeño paso para el hombre, un gran salto para la humanidad."', 'system');
          
          setTimeout(() => {
            this.unlockNextStage();
          }, 2500);
        } else {
          l_crashed = true;
          SoundSynth.playFail();
          this.logMessage('¡ALERTA DE IMPACTO! EL MÓDULO SE HA DESTRUIDO.', 'danger');
          if (!onPlatform) this.logMessage('FALLO: Módulo erró la zona de alunizaje.', 'danger');
          else if (!speedOk) this.logMessage('FALLO: Impacto a alta velocidad vertical.', 'danger');
          else if (!angleOk) this.logMessage('FALLO: Módulo volcó por ángulo excesivo.', 'danger');
        }
      }
    };

    const drawLander = () => {
      ctxL.clearRect(0, 0, canvasL.width, canvasL.height);

      // Dibujar estrellas de fondo simples locales
      ctxL.fillStyle = 'rgba(255,255,255,0.3)';
      for (let i = 0; i < 30; i++) {
        const sx = (Math.sin(i*12) * 0.5 + 0.5) * canvasL.width;
        const sy = (Math.cos(i*35) * 0.5 + 0.5) * canvasL.height;
        ctxL.fillRect(sx, sy, 1, 1);
      }

      // Dibujar Terreno Lunar
      ctxL.beginPath();
      ctxL.moveTo(terrainPoints[0].x, terrainPoints[0].y);
      for (let i = 1; i < terrainPoints.length; i++) {
        ctxL.lineTo(terrainPoints[i].x, terrainPoints[i].y);
      }
      ctxL.lineTo(canvasL.width, canvasL.height);
      ctxL.lineTo(0, canvasL.height);
      ctxL.closePath();
      ctxL.fillStyle = '#162217';
      ctxL.fill();
      ctxL.lineWidth = 2;
      ctxL.strokeStyle = '#224425';
      ctxL.stroke();

      // Dibujar la zona de aterrizaje (plataforma) de color verde resaltado
      ctxL.beginPath();
      ctxL.moveTo(180, 310);
      ctxL.lineTo(300, 310);
      ctxL.lineWidth = 4;
      ctxL.strokeStyle = '#00ff66';
      ctxL.stroke();
      
      // Letrero en la plataforma
      ctxL.fillStyle = '#00ff66';
      ctxL.font = '8px Space Mono';
      ctxL.fillText('EAGLE LANDING PAD', 198, 325);

      // Dibujar el Módulo Lunar (Lander)
      ctxL.save();
      ctxL.translate(l_x, l_y);
      ctxL.rotate((l_angle * Math.PI) / 180);

      // Llamas si está acelerando
      const isThrusting = (activeKeys['ArrowUp'] || activeKeys['KeyW'] || touchThrust) && l_fuel > 0;
      if (isThrusting) {
        ctxL.beginPath();
        ctxL.moveTo(-4, 6);
        ctxL.lineTo(0, 18 + Math.random() * 8);
        ctxL.lineTo(4, 6);
        ctxL.closePath();
        ctxL.fillStyle = '#ff7700';
        ctxL.fill();

        ctxL.beginPath();
        ctxL.moveTo(-2, 6);
        ctxL.lineTo(0, 10 + Math.random() * 5);
        ctxL.lineTo(2, 6);
        ctxL.closePath();
        ctxL.fillStyle = '#ffb000';
        ctxL.fill();
      }

      // Patas de aterrizaje
      ctxL.strokeStyle = '#ffffff';
      ctxL.lineWidth = 1.5;
      // Pata Izq
      ctxL.beginPath();
      ctxL.moveTo(-6, 0);
      ctxL.lineTo(-11, 8);
      ctxL.moveTo(-11, 8);
      ctxL.lineTo(-13, 8);
      ctxL.stroke();
      // Pata Der
      ctxL.beginPath();
      ctxL.moveTo(6, 0);
      ctxL.lineTo(11, 8);
      ctxL.moveTo(11, 8);
      ctxL.lineTo(13, 8);
      ctxL.stroke();

      // Cuerpo principal (octágono vector)
      ctxL.beginPath();
      ctxL.moveTo(-6, -6);
      ctxL.lineTo(6, -6);
      ctxL.lineTo(8, 0);
      ctxL.lineTo(6, 6);
      ctxL.lineTo(-6, 6);
      ctxL.lineTo(-8, 0);
      ctxL.closePath();
      ctxL.fillStyle = '#061108';
      ctxL.fill();
      ctxL.strokeStyle = '#33ff33';
      ctxL.lineWidth = 1.5;
      ctxL.stroke();

      // Cabina superior
      ctxL.beginPath();
      ctxL.moveTo(-4, -6);
      ctxL.lineTo(4, -6);
      ctxL.lineTo(3, -11);
      ctxL.lineTo(-3, -11);
      ctxL.closePath();
      ctxL.fillStyle = '#11aa11';
      ctxL.fill();
      ctxL.stroke();

      ctxL.restore();

      // Dibujar overlay de derrota o victoria dentro del canvas
      if (l_crashed) {
        ctxL.fillStyle = 'rgba(0,0,0,0.7)';
        ctxL.fillRect(0, 0, canvasL.width, canvasL.height);
        
        ctxL.fillStyle = '#ff3333';
        ctxL.font = 'bold 16px Orbitron';
        ctxL.textAlign = 'center';
        ctxL.fillText('CRASH DE MISIÓN', canvasL.width / 2, canvasL.height / 2 - 20);
        
        ctxL.fillStyle = '#ffffff';
        ctxL.font = '10px Space Mono';
        ctxL.fillText('Módulo destruido. Altitud o velocidad inadecuada.', canvasL.width / 2, canvasL.height / 2 + 5);

        // Renderizar botón de reintento manual dibujado
        ctxL.fillStyle = '#11aa11';
        ctxL.fillRect(canvasL.width / 2 - 50, canvasL.height / 2 + 25, 100, 24);
        ctxL.strokeStyle = '#33ff33';
        ctxL.strokeRect(canvasL.width / 2 - 50, canvasL.height / 2 + 25, 100, 24);
        
        ctxL.fillStyle = '#ffffff';
        ctxL.font = 'bold 9px Space Mono';
        ctxL.fillText('REINTENTAR', canvasL.width / 2, canvasL.height / 2 + 40);
      }

      if (l_landed) {
        ctxL.fillStyle = 'rgba(0,0,0,0.6)';
        ctxL.fillRect(0, 0, canvasL.width, canvasL.height);
        
        ctxL.fillStyle = '#00ff66';
        ctxL.font = 'bold 16px Orbitron';
        ctxL.textAlign = 'center';
        ctxL.fillText('¡ALUNIZAJE EXITOSO!', canvasL.width / 2, canvasL.height / 2 - 10);
        
        ctxL.fillStyle = '#ffffff';
        ctxL.font = '10px Space Mono';
        ctxL.fillText('Transmisión de telemetría completa.', canvasL.width / 2, canvasL.height / 2 + 15);
      }
    };

    // Control del click sobre el canvas (por si hacen click en REINTENTAR en el canvas)
    canvasL.addEventListener('click', (e) => {
      if (l_crashed) {
        const rect = canvasL.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        // Escalar coordenadas del click a coordenadas de dibujo (480x360)
        const scaleX = canvasL.width / rect.width;
        const scaleY = canvasL.height / rect.height;
        
        const finalClickX = clickX * scaleX;
        const finalClickY = clickY * scaleY;

        // Comprobar colisión con el botón "REINTENTAR" (centrado en canvasL.width/2 - 50, canvasL.height/2 + 25)
        if (finalClickX >= (canvasL.width / 2 - 50) && finalClickX <= (canvasL.width / 2 + 50) &&
            finalClickY >= (canvasL.height / 2 + 25) && finalClickY <= (canvasL.height / 2 + 49)) {
          SoundSynth.playClick();
          cleanup();
          this.loadStage(2); // Recargar esta misma etapa
        }
      }
    });

    const gameLoop = () => {
      updateLander();
      drawLander();
      if (!l_crashed && !l_landed) {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    // Limpieza de eventos al salir de la sección
    const cleanup = () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('keyup', handleKeyup);
      cancelAnimationFrame(animationFrameId);
      SoundSynth.stopEngine();
    };

    // Guardamos la referencia de limpieza en el controlador general
    this.stageCleanup = cleanup;
  },

  // ----------------------------------------------------------------------------
  // MISIÓN 3: DESENCRIPTADOR DE DISCURSO (JFK Speech Analyzer)
  // ----------------------------------------------------------------------------
  initStage3Decoder(container) {
    const questions = [
      {
        text: "¿Cuál fue el motivo principal expresado implícitamente por el presidente Kennedy para realizar el viaje a la Luna?",
        options: [
          "Establecer colonias científicas de investigación pacífica a nivel internacional.",
          "Vencer a la Unión Soviética en la disputa de poder geopolítico de la Guerra Fría.",
          "Extraer helio-3 y recursos energéticos valiosos del suelo lunar."
        ],
        answer: 1, // B
        hint: "JFK mencionó ante el Congreso la batalla entre 'libertad y tiranía'."
      },
      {
        text: "¿Cuál fue el impacto de este discurso de 1961 en términos de infraestructura y empleo en los Estados Unidos?",
        options: [
          "Provocó el desempleo de científicos al cancelar proyectos de aviación militar.",
          "Desató protestas masivas debido al alto costo financiero del programa.",
          "Movilizó un proceso masivo que llegó a emplear a 400.000 ciudadanos estadounidenses."
        ],
        answer: 2, // C
        hint: "Cerca de medio millón de personas unieron esfuerzos para la NASA."
      },
      {
        text: "¿Qué plazo temporal explícito propuso JFK ante el Congreso para lograr el alunizaje?",
        options: [
          "Antes de que termine la década de 1960 (antes de 1970).",
          "En el transcurso de los siguientes 25 años.",
          "Antes del inicio del siglo XXI."
        ],
        answer: 0, // A
        hint: "Propuso lograr el objetivo 'antes de que termine esta década'."
      }
    ];

    let qIdx = 0;
    
    const renderQuizQuestion = () => {
      if (qIdx < questions.length) {
        const q = questions[qIdx];
        container.innerHTML = `
          <div class="decoder-game-container">
            <div class="game-desc-panel">
              <strong>MISIÓN 3: DECODIFICADOR DEL DISCURSO DE JFK</strong><br>
              Analiza los archivos históricos de la izquierda y el video del discurso para decodificar las preguntas clave de seguridad.
            </div>
            
            <div class="terminal-quiz-box">
              <div class="scenario-index">PREGUNTA DE SEGURIDAD ${qIdx + 1} DE ${questions.length}</div>
              <div class="terminal-question-title">${q.text}</div>
              <div class="terminal-options-list">
                ${q.options.map((opt, i) => `
                  <button class="terminal-option-item" data-idx="${i}" type="button">
                    [${String.fromCharCode(65 + i)}] ${opt}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
        `;

        // Añadir listeners
        container.querySelectorAll('.terminal-option-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const selectedIdx = parseInt(btn.getAttribute('data-idx'));
            if (selectedIdx === q.answer) {
              btn.classList.add('correct');
              SoundSynth.playSuccess();
              this.logMessage(`RESPUESTA ${qIdx+1} CORRECTA. DECODIFICANDO ENLACE DE DATOS...`, 'success');
              
              qIdx++;
              this.updateScore(30);
              
              setTimeout(() => {
                renderQuizQuestion();
              }, 1200);
            } else {
              btn.classList.add('wrong');
              SoundSynth.playFail();
              this.logMessage(`ERROR EN ACCESO. RESPUESTA INCORRECTA. REINTENTANDO...`, 'danger');
              
              setTimeout(() => {
                btn.classList.remove('wrong');
              }, 1000);
            }
          });
        });
      } else {
        // Cuestionario completado con éxito
        container.innerHTML = `
          <div class="decoder-game-container">
            <div class="decrypted-quote-panel">
              <strong>¡DISCURSO HISTÓRICO DECODIFICADO!</strong>
              "Creo que esta nación debe comprometerse a lograr el objetivo, antes de que termine esta década, de llevar a un hombre a la Luna y devolverlo sano y salvo a la Tierra."
              <span style="display:block; margin-top:8px; opacity:0.6">— J. F. Kennedy, 25/05/1961</span>
            </div>
            
            <button id="decoder-next-btn" class="chrono-verify-btn">PROCEDER A LA ETAPA 4</button>
          </div>
        `;

        document.getElementById('decoder-next-btn').addEventListener('click', () => {
          SoundSynth.playClick();
          this.unlockNextStage();
        });
      }
    };

    renderQuizQuestion();
  },

  // ----------------------------------------------------------------------------
  // MISIÓN 4: DECISIONES SOBRE EL TRATADO ESPACIAL (Treaty Simulator)
  // ----------------------------------------------------------------------------
  initStage4Treaty(container) {
    const scenarios = [
      {
        title: "Dilema Militar 1967",
        desc: "Las fuerzas de defensa proponen construir fortificaciones militares encubiertas y búnkeres de misiles en un cráter del lado oscuro de la Luna para protegerse contra un posible ataque nuclear enemigo. ¿Qué acción toma?",
        choices: [
          { text: "Aprobar construcción para la defensa.", correct: false },
          { text: "Rechazar por violar la desmilitarización del tratado.", correct: true }
        ],
        feedbackCorrect: "Correcto. El Tratado sobre el Espacio Ultraterrestre prohíbe explícitamente el establecimiento de bases militares, fortificaciones y pruebas de armas en cuerpos celestes.",
        feedbackWrong: "Incorrecto. Violaría el artículo IV del Tratado, que exige que la Luna y cuerpos celestes sean usados exclusivamente con fines pacíficos."
      },
      {
        title: "Telecomunicaciones orbitales",
        desc: "Una corporación privada solicita licencias para desplegar una constelación de satélites de telecomunicaciones comerciales en órbita baja para telefonía e internet. ¿Qué acción toma?",
        choices: [
          { text: "Aprobar el proyecto comercial pacífico.", correct: true },
          { text: "Rechazar por apropiación del espacio terrestre.", correct: false }
        ],
        feedbackCorrect: "Correcto. El tratado permite la libre exploración y uso científico y comercial del espacio siempre que sea en beneficio y provecho de toda la humanidad, sin pretender soberanía.",
        feedbackWrong: "Incorrecto. El despliegue de satélites de comunicación comercial está totalmente permitido, siempre que no implique reclamo de territorio exclusivo soberano."
      },
      {
        title: "Reclamación territorial",
        desc: "Tras clavar la bandera en la Luna, asesores gubernamentales proponen declarar formalmente soberanía nacional exclusiva sobre el Mar de la Tranquilidad para prohibir que otras naciones alunicen en esa región. ¿Qué acción toma?",
        choices: [
          { text: "Reclamar territorio nacional para la posteridad.", correct: false },
          { text: "Rechazar la anexión territorial.", correct: true }
        ],
        feedbackCorrect: "Correcto. El Artículo II del tratado estipula explícitamente que el espacio ultraterrestre, incluida la Luna, no está sujeto a apropiación nacional por reclamos de soberanía.",
        feedbackWrong: "Incorrecto. Esto causaría un conflicto internacional severo y violaría la prohibición de apropiación nacional soberana establecida en el acuerdo."
      }
    ];

    let sIdx = 0;

    const renderScenario = () => {
      if (sIdx < scenarios.length) {
        const sc = scenarios[sIdx];
        container.innerHTML = `
          <div class="treaty-game-container">
            <div class="game-desc-panel">
              <strong>MISIÓN 4: COMPROMISO DEL TRATADO DEL ESPACIO ULTRATERRESTRE (1967)</strong><br>
              Actúa como Asesor Jurídico de la Misión. Toma las decisiones que respeten la legislación espacial firmada por las naciones.
            </div>
            
            <div class="scenario-card">
              <span class="scenario-index">CASO DIPLOMÁTICO ${sIdx + 1} DE ${scenarios.length}</span>
              <div class="terminal-question-title" style="font-weight:bold; color:#ffffff;">${sc.title}</div>
              <div class="scenario-text">${sc.desc}</div>
              
              <div class="scenario-choices">
                ${sc.choices.map((choice, i) => `
                  <button class="scenario-btn" data-correct="${choice.correct}" data-idx="${i}" type="button">
                    ${choice.text}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
        `;

        container.querySelectorAll('.scenario-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const isCorrect = btn.getAttribute('data-correct') === 'true';
            const choiceIdx = parseInt(btn.getAttribute('data-idx'));
            
            if (isCorrect) {
              btn.className = 'scenario-btn success-choice';
              SoundSynth.playSuccess();
              this.logMessage(`DECISIÓN ${sIdx+1} CORRECTA. ${sc.feedbackCorrect}`, 'success');
              this.updateScore(30);
              
              sIdx++;
              setTimeout(() => renderScenario(), 1800);
            } else {
              btn.className = 'scenario-btn fail-choice';
              SoundSynth.playFail();
              this.logMessage(`ALERTA: DECISIÓN COMPROMETIDA. ${sc.feedbackWrong}`, 'danger');
              
              setTimeout(() => {
                btn.className = 'scenario-btn';
              }, 1200);
            }
          });
        });
      } else {
        // Todos los casos resueltos
        container.innerHTML = `
          <div class="treaty-game-container">
            <div class="decrypted-quote-panel" style="border-color:#00ff66; background:rgba(0,255,102,0.02)">
              <strong>¡ACUERDO INTERNACIONAL COMPLETADO!</strong>
              Has ratificado y protegido las leyes del Tratado del Espacio Ultraterrestre, asegurando la exploración pacífica del cosmos para todas las naciones.
            </div>
            
            <button id="treaty-next-btn" class="chrono-verify-btn">PROCEDER A LA ETAPA FINAL 5</button>
          </div>
        `;

        document.getElementById('treaty-next-btn').addEventListener('click', () => {
          SoundSynth.playClick();
          this.unlockNextStage();
        });
      }
    };

    renderScenario();
  },

  // ----------------------------------------------------------------------------
  // MISIÓN 5: CONECTOR TECNOLÓGICO (Tech Matcher)
  // ----------------------------------------------------------------------------
  initStage5TechMatcher(container) {
    const techPairs = [
      { id: '1', left: 'GPS y Geolocalización', right: 'Navegación en mapas del celular' },
      { id: '2', left: 'Materiales Trajes Térmicos', right: 'Ropa para climas extremos' },
      { id: '3', left: 'Purificación de agua eficiente', right: 'Filtros domésticos' },
      { id: '4', left: 'Circuitos Integrados Apolo', right: 'Microchips en Smartphones' }
    ];

    // Mezclar columnas independientemente
    const scrambledLeft = [...techPairs].sort(() => Math.random() - 0.5);
    const scrambledRight = [...techPairs].sort(() => Math.random() - 0.5);

    container.innerHTML = `
      <div class="tech-game-container">
        <div class="game-desc-panel">
          <strong>MISIÓN 5: EL LEGADO TECNOLÓGICO EN EL PRESENTE</strong><br>
          Conecta los desarrollos tecnológicos de la Carrera Espacial (izquierda) con sus aplicaciones cotidianas hoy (derecha).
        </div>
        
        <div class="tech-columns">
          <div class="tech-col tech-col-left" id="tech-left-list">
            ${scrambledLeft.map(item => `
              <div class="tech-card-item" data-id="${item.id}">
                ${item.left}
              </div>
            `).join('')}
          </div>
          
          <div class="tech-col tech-col-right" id="tech-right-list">
            ${scrambledRight.map(item => `
              <div class="tech-card-item" data-id="${item.id}">
                ${item.right}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    let selectedLeftId = null;
    let selectedLeftEl = null;

    const leftCards = container.querySelectorAll('#tech-left-list .tech-card-item');
    const rightCards = container.querySelectorAll('#tech-right-list .tech-card-item');

    leftCards.forEach(card => {
      card.addEventListener('click', () => {
        if (card.classList.contains('matched')) return;
        
        SoundSynth.playClick();
        
        // Limpiar selección previa de la columna izquierda
        leftCards.forEach(c => c.classList.remove('selected'));
        
        card.classList.add('selected');
        selectedLeftId = card.getAttribute('data-id');
        selectedLeftEl = card;
      });
    });

    rightCards.forEach(card => {
      card.addEventListener('click', () => {
        if (card.classList.contains('matched') || !selectedLeftId) return;
        
        const rightId = card.getAttribute('data-id');
        
        if (selectedLeftId === rightId) {
          // Acierto
          SoundSynth.playSuccess();
          this.logMessage(`CONEXIÓN TECNOLÓGICA VERIFICADA EN ETAPA 5.`, 'success');
          this.updateScore(30);
          
          selectedLeftEl.classList.remove('selected');
          selectedLeftEl.classList.add('matched');
          card.classList.add('matched');
          
          selectedLeftId = null;
          selectedLeftEl = null;
          
          // Verificar victoria
          const matchedCount = container.querySelectorAll('.tech-card-item.matched').length;
          if (matchedCount === techPairs.length * 2) {
            this.unlockNextStage();
          }
        } else {
          // Error
          SoundSynth.playFail();
          card.classList.add('wrong');
          this.logMessage('SISTEMA: VINCULACIÓN INCOMPATIBLE. REINTENTE.', 'danger');
          
          setTimeout(() => {
            card.classList.remove('wrong');
          }, 1000);
        }
      });
    });
  }
};

// ============================================================================
// 5. INICIALIZACIÓN
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  GameController.init();
});
